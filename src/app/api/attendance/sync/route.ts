import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { attendanceLogs, employees } from "@/db/schema";
import { and, eq } from "drizzle-orm";
import { logger } from "@/lib/logger";

interface OfflinePunch {
  employeeId: string;
  siteId: string | null;
  timestamp: string;
  latitude: number;
  longitude: number;
  photo?: string;
  deviceInfo?: string;
  browser?: string;
  action: "check_in" | "check_out";
  status: "present" | "late";
  faceScore: number;
}

export async function POST(req: NextRequest) {
  return logger.track("POST /api/attendance/sync", async () => {
    try {
      const punches: OfflinePunch[] = await req.json();
      if (!Array.isArray(punches)) {
        return NextResponse.json({ error: "Invalid payload format" }, { status: 400 });
      }

      const ipAddress =
        req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
        req.headers.get("x-real-ip") ??
        null;

      const syncedIds: string[] = [];

      for (const punch of punches) {
        // Fetch employee to get organizationId
        const [employee] = await db
          .select()
          .from(employees)
          .where(eq(employees.id, punch.employeeId))
          .limit(1);

        if (!employee || !employee.organizationId) continue;

        const punchTime = new Date(punch.timestamp);
        // Format date string from timestamp in UTC or local depending on requirement
        const dateStr = punch.timestamp.split("T")[0];

        const [existing] = await db
          .select()
          .from(attendanceLogs)
          .where(
            and(
              eq(attendanceLogs.employeeId, employee.id),
              eq(attendanceLogs.date, dateStr)
            )
          )
          .limit(1);

        if (punch.action === "check_in" || !existing) {
          if (!existing) {
            // Create a new check-in record
            const [log] = await db
              .insert(attendanceLogs)
              .values({
                organizationId: employee.organizationId,
                employeeId: employee.id,
                siteId: punch.siteId,
                date: dateStr,
                checkInTime: punchTime,
                status: punch.status,
                confidenceScore: punch.faceScore,
                gpsLatitude: punch.latitude,
                gpsLongitude: punch.longitude,
                photoUrl: punch.photo,
                deviceInfo: punch.deviceInfo,
                browser: punch.browser,
                ipAddress,
                punchType: "in",
              })
              .returning();
            if (log) syncedIds.push(punch.timestamp);
          } else {
            // Already exists, just skip or update check-in time
            syncedIds.push(punch.timestamp);
          }
        } else if (punch.action === "check_out" && existing) {
          // Update check-out time of the existing record
          const [log] = await db
            .update(attendanceLogs)
            .set({
              checkOutTime: punchTime,
              confidenceScore: punch.faceScore,
              gpsLatitude: punch.latitude,
              gpsLongitude: punch.longitude,
              photoUrl: punch.photo,
              deviceInfo: punch.deviceInfo,
              browser: punch.browser,
              ipAddress,
              punchType: "out",
              updatedAt: new Date(),
            })
            .where(eq(attendanceLogs.id, existing.id))
            .returning();
          if (log) syncedIds.push(punch.timestamp);
        }
      }

      return NextResponse.json({
        success: true,
        message: "Offline logs synchronized successfully",
        syncedCount: syncedIds.length,
      });
    } catch (error) {
      console.error("Offline sync error:", error);
      return NextResponse.json(
        { error: error instanceof Error ? error.message : "Failed to sync offline logs" },
        { status: 500 }
      );
    }
  });
}
