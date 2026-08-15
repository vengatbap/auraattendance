import { PunchStage } from "../engine/pipeline";
import { PunchContext } from "../engine/context";
import { AuditService } from "@/modules/audit/service/audit.service";

export class AuditStage implements PunchStage {
  async execute(context: PunchContext): Promise<void> {
    // Audit stage runs AFTER the main transaction has committed.
    // Audit log errors will not fail the committed attendance punch.
    try {
      await AuditService.log({
        organizationId: context.trusted.organizationId,
        userId: null, // Employee clock-ins do not correspond to dashboard console user records
        action: context.outcome === "REJECTED" ? "punch_rejected" : "punch_accepted",
        entity: "attendance_event",
        entityId: context.attendanceEvent?.id ?? null,
        details: {
          employeeId: context.employee?.id ?? null,
          requestId: context.requestId,
          outcome: context.outcome,
          flags: context.flags,
          warnings: context.warnings,
          receivedAt: context.trusted.receivedAt.toISOString(),
          isOffline: context.input.isOffline ?? false,
        },
      });
    } catch (err) {
      console.error("Audit logging failed inside Attendance Engine:", err);
    }
  }
}
