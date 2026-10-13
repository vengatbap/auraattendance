/* eslint-disable @typescript-eslint/no-explicit-any */
import { PunchStage } from "../engine/pipeline";
import { PunchContext } from "../engine/context";
import { AttendanceEngineRepository } from "../repository/attendance-engine.repository";
import { db } from "@/db";
import { attendanceLogs } from "@/db/schema";
import { eq } from "drizzle-orm";
import { PunchResult } from "../types";

export class PersistStage implements PunchStage {
  async execute(context: PunchContext): Promise<void> {
    if (context.outcome === undefined) {
      context.outcome = "REJECTED"; // fallback
    }

    const orgId = context.trusted.organizationId;
    const tz = context.organization?.timezone || "UTC";
    const clientEventId = context.input.clientEventId;

    // Resolve date in organization timezone
    const dateString = this.getOrgDateString(context.trusted.receivedAt, tz);

    const occurredDate = context.input.capturedAt ? new Date(context.input.capturedAt) : context.trusted.receivedAt;

    // Compile event payload
    const eventInsert = {
      organizationId: orgId,
      employeeId: context.employee?.id ?? null,
      siteId: context.site?.id ?? null,
      clientEventId: clientEventId,
      eventType: context.result?.action || "CHECK_IN",
      outcome: context.outcome,
      capturedAt: occurredDate,
      receivedAt: context.trusted.receivedAt,
      gpsLatitude: context.input.latitude ?? null,
      gpsLongitude: context.input.longitude ?? null,
      gpsDistanceMeters: context.gpsDistanceMeters ?? null,
      faceDistance: context.faceDistance ?? null,
      faceThreshold: context.faceThreshold ?? null,
      faceMatchPassed: context.faceMatchPassed ?? null,
      deviceInfo: context.input.deviceInfo ?? null,
      browser: context.input.browser ?? null,
      ipAddress: context.trusted.ipAddress ?? null,
      isOffline: context.input.isOffline ?? false,
      flags: context.flags,
      warnings: context.warnings,
      resultSnapshot: context.result ?? null,
      requestId: context.requestId,
      authenticationMethod: context.authMethod || "FACE",
      authenticationResult: context.authResult || "FAILED",
    };

    try {
      if (context.outcome === "REJECTED" || !context.employee) {
        // Persist only the rejected event
        const savedEvent = await AttendanceEngineRepository.persistEventOnly(eventInsert);
        context.attendanceEvent = savedEvent;
      } else {
        // Atomic transaction to save event and update/create daily session logs
        const resolvedAction = context.result?.action;

        const result = await AttendanceEngineRepository.persistPunchTransaction(eventInsert, async () => {
          if (resolvedAction === "CHECK_IN") {
            const statusVal = (context.resolvedStatus || "PRESENT").toLowerCase() as "present" | "late" | "absent";
            const [insertedLog] = await db
              .insert(attendanceLogs)
              .values({
                organizationId: orgId,
                employeeId: context.employee!.id,
                siteId: context.site?.id ?? null,
                date: dateString,
                checkInTime: occurredDate,
                status: statusVal,
                deviceInfo: context.input.deviceInfo ?? null,
                browser: context.input.browser ?? null,
                photoUrl: context.input.photoUrl ?? null,
                confidenceScore: context.faceDistance ?? null,
                gpsDistanceMeters: context.gpsDistanceMeters ?? null,
                gpsLatitude: context.input.latitude ?? null,
                gpsLongitude: context.input.longitude ?? null,
                ipAddress: context.trusted.ipAddress ?? null,
                punchType: "in",
                flags: context.flags,
                requestId: context.requestId,
                isOffline: context.input.isOffline ?? false,
                authenticationMethod: context.authMethod || "FACE",
                authenticationResult: context.authResult || "FAILED",
              })
              .returning();
            return insertedLog;
          } else {
            // CHECK_OUT update
            const logId = context.currentLog?.id;
            if (!logId) return null;

            // Merge flags
            const previousFlags = (context.currentLog?.flags || []) as string[];
            const mergedFlags = Array.from(new Set([...previousFlags, ...context.flags]));

            const [updatedLog] = await db
              .update(attendanceLogs)
              .set({
                checkOutTime: occurredDate,
                flags: mergedFlags,
                requestId: context.requestId,
                isOffline: context.currentLog!.isOffline || (context.input.isOffline ?? false),
                updatedAt: new Date(),
                version: (context.currentLog!.version ?? 1) + 1,
              })
              .where(eq(attendanceLogs.id, logId))
              .returning();
            return updatedLog;
          }
        });

        context.attendanceEvent = result.event;
        if (result.log) {
          context.attendanceLog = result.log;
        }
      }
    } catch (err: unknown) {
      const errAny = err as unknown as any;
      const isUniqueViolation = errAny?.code === "23505" || String(err).includes("unique constraint") || String(err).includes("duplicate key");
      if (isUniqueViolation && clientEventId) {
        const existingEvent = await AttendanceEngineRepository.findEventByIdempotency(orgId, clientEventId);
        if (existingEvent) {
          context.isIdempotentRepeat = true;
          context.originalResult = existingEvent.resultSnapshot as PunchResult;
          return;
        }
      }
      throw err;
    }
  }

  private getOrgDateString(date: Date, timezone: string): string {
    try {
      const formatter = new Intl.DateTimeFormat("en-US", {
        timeZone: timezone,
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      });
      const parts = formatter.formatToParts(date);
      const year = parts.find((p) => p.type === "year")?.value;
      const month = parts.find((p) => p.type === "month")?.value;
      const day = parts.find((p) => p.type === "day")?.value;
      return `${year}-${month}-${day}`;
    } catch {
      const yyyy = date.getFullYear();
      const mm = String(date.getMonth() + 1).padStart(2, "0");
      const dd = String(date.getDate()).padStart(2, "0");
      return `${yyyy}-${mm}-${dd}`;
    }
  }
}

