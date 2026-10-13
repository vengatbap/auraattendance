import { NextRequest } from "next/server";
import { db } from "@/db";
import { attendanceAdjustments, attendanceLogs, auditLogs, employees } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { z } from "zod";
import { getSession, getTenantId } from "@/lib/auth";
import { PermissionService } from "@/lib/rbac";
import { createApiResponse } from "@/lib/api-response";
import { FeatureService, FeatureRegistry } from "@/lib/features";

const AdjustmentSchema = z.object({
  attendanceLogId: z.string().uuid(),
  type: z.enum(["check_in_time", "check_out_time", "mark_present", "mark_absent", "missed_punch"]),
  checkInTime: z.string().datetime().optional(),
  checkOutTime: z.string().datetime().optional(),
  date: z.string().date().optional(),
  reason: z.string().min(1, "Reason is required"),
});

export async function POST(req: NextRequest) {
  try {
    // 1. Verify authentication
    const session = await getSession();
    const orgId = getTenantId(session);
    if (!session || !orgId) {
      return createApiResponse({
        success: false,
        message: "Unauthorized",
        status: 401,
      });
    }

    // 2. Verify RBAC permissions
    if (PermissionService.cannot(session, "attendance.adjust")) {
      return createApiResponse({
        success: false,
        message: "Forbidden: insufficient permissions",
        status: 403,
      });
    }

    // 3. Verify feature flag
    const isFeatureEnabled = await FeatureService.isEnabled(orgId, FeatureRegistry.ADJUSTMENTS);
    if (!isFeatureEnabled) {
      return createApiResponse({
        success: false,
        message: "Forbidden: adjustments feature is disabled for this organization",
        status: 403,
      });
    }

    const body = await req.json();
    const result = AdjustmentSchema.safeParse(body);

    if (!result.success) {
      return createApiResponse({
        success: false,
        message: "Validation failed",
        errors: result.error.issues,
        status: 400,
      });
    }

    const { attendanceLogId, type, checkInTime, checkOutTime, date, reason } = result.data;

    // Fetch the attendance log
    const [attendanceLog] = await db
      .select()
      .from(attendanceLogs)
      .where(
        and(
          eq(attendanceLogs.id, attendanceLogId),
          eq(attendanceLogs.organizationId, orgId)
        )
      );

    if (!attendanceLog) {
      return createApiResponse({
        success: false,
        message: "Attendance log not found",
        status: 404,
      });
    }

    // Get employee info for audit log
    const [employee] = await db
      .select()
      .from(employees)
      .where(eq(employees.id, attendanceLog.employeeId));

    // Get current version for optimistic locking
    const currentVersion = attendanceLog.version ?? 1;

    // Apply adjustment based on type
    const updateData: Partial<typeof attendanceLogs.$inferInsert> = { updatedAt: new Date() };

    switch (type) {
      case "check_in_time":
        if (!checkInTime) throw new Error("checkInTime required for check_in_time adjustment");
        updateData.checkInTime = new Date(checkInTime);
        break;
      case "check_out_time":
        if (!checkOutTime) throw new Error("checkOutTime required for check_out_time adjustment");
        updateData.checkOutTime = new Date(checkOutTime);
        break;
      case "mark_present":
        updateData.status = "present";
        break;
      case "mark_absent":
        updateData.status = "absent";
        break;
      case "missed_punch":
        if (!date || !checkInTime) throw new Error("date and checkInTime required for missed_punch");
        // Create a new attendance log for the missed day
        await db.insert(attendanceLogs).values({
          organizationId: attendanceLog.organizationId,
          employeeId: attendanceLog.employeeId,
          siteId: attendanceLog.siteId,
          date: date,
          checkInTime: new Date(checkInTime),
          checkOutTime: checkOutTime ? new Date(checkOutTime) : null,
          status: "present",
          version: 1,
        });

        // Log the adjustment in audit logs
        await db.insert(auditLogs).values({
          organizationId: attendanceLog.organizationId,
          userId: session.userId,
          action: "create_missed_punch",
          entity: "attendance_logs",
          entityId: attendanceLogId,
          details: {
            originalLogId: attendanceLogId,
            date,
            checkInTime,
            checkOutTime,
            reason,
          },
        });

        await db.insert(attendanceAdjustments).values({
          organizationId: attendanceLog.organizationId,
          attendanceLogId,
          adjustedByUserId: session.userId,
          type,
          reason,
          before: attendanceLog,
          after: {
            date,
            checkInTime,
            checkOutTime,
            status: "present",
          },
        });

        return createApiResponse({
          success: true,
          message: "Missed punch added successfully",
          status: 201,
        });
    }

    // Update the attendance log with optimistic locking check
    const [updatedLog] = await db
      .update(attendanceLogs)
      .set({
        ...updateData,
        version: currentVersion + 1,
      })
      .where(
        and(
          eq(attendanceLogs.id, attendanceLogId),
          eq(attendanceLogs.version, currentVersion)
        )
      )
      .returning();

    if (!updatedLog) {
      return createApiResponse({
        success: false,
        message: "Concurrent update detected. The record has been modified by another process. Please reload and try again.",
        status: 409,
      });
    }

    // Log the adjustment in audit logs
    await db.insert(auditLogs).values({
      organizationId: attendanceLog.organizationId,
      userId: session.userId,
      action: `adjust_${type}`,
      entity: "attendance_logs",
      entityId: attendanceLogId,
      details: {
        employeeId: attendanceLog.employeeId,
        employeeName: employee?.name,
        adjustmentType: type,
        previousCheckInTime: attendanceLog.checkInTime,
        previousCheckOutTime: attendanceLog.checkOutTime,
        previousStatus: attendanceLog.status,
        newCheckInTime: checkInTime || attendanceLog.checkInTime,
        newCheckOutTime: checkOutTime || attendanceLog.checkOutTime,
        newStatus: updateData.status || attendanceLog.status,
        reason,
      },
    });

    await db.insert(attendanceAdjustments).values({
      organizationId: attendanceLog.organizationId,
      attendanceLogId,
      adjustedByUserId: session.userId,
      type,
      reason,
      before: attendanceLog,
      after: {
        ...attendanceLog,
        ...updateData,
        version: currentVersion + 1,
      },
    });

    return createApiResponse({
      success: true,
      message: `${type} adjusted successfully`,
    });
  } catch (error) {
    console.error("Error adjusting attendance:", error);
    return createApiResponse({
      success: false,
      message: error instanceof Error ? error.message : "Failed to adjust attendance",
      status: 500,
    });
  }
}
