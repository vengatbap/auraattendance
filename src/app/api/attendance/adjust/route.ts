import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { attendanceAdjustments, attendanceLogs, auditLogs, employees } from "@/db/schema";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { getSession } from "@/lib/auth";

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
    // Verify authentication
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const result = AdjustmentSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json({ error: result.error.issues }, { status: 400 });
    }

    const { attendanceLogId, type, checkInTime, checkOutTime, date, reason } = result.data;

    // Fetch the attendance log
    const [attendanceLog] = await db
      .select()
      .from(attendanceLogs)
      .where(eq(attendanceLogs.id, attendanceLogId));

    if (!attendanceLog) {
      return NextResponse.json({ error: "Attendance log not found" }, { status: 404 });
    }

    // Get employee info for audit log
    const [employee] = await db
      .select()
      .from(employees)
      .where(eq(employees.id, attendanceLog.employeeId));

    // Apply adjustment based on type
    let updateData: Record<string, any> = { updatedAt: new Date() };

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
        });

        // Log the adjustment
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

        return NextResponse.json(
          { message: "Missed punch added successfully" },
          { status: 201 }
        );
    }

    // Update the attendance log
    await db
      .update(attendanceLogs)
      .set(updateData)
      .where(eq(attendanceLogs.id, attendanceLogId));

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
      },
    });

    return NextResponse.json(
      { message: `${type} adjusted successfully` },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error adjusting attendance:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to adjust attendance" },
      { status: 500 }
    );
  }
}
