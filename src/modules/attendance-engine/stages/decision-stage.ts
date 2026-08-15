import { PunchStage } from "../engine/pipeline";
import { PunchContext } from "../engine/context";
import { AttendanceFlag, AttendanceOutcome, PunchResult } from "../types";

export class DecisionStage implements PunchStage {
  async execute(context: PunchContext): Promise<void> {
    // 1. Evaluate collected flags and determine outcome if not already set to REJECTED
    if (context.outcome !== "REJECTED") {
      let finalOutcome: AttendanceOutcome = "ACCEPTED";

      if (
        context.flags.includes(AttendanceFlag.FACE_NOT_REGISTERED)
      ) {
        finalOutcome = "REJECTED";
      } else if (
        context.flags.includes(AttendanceFlag.DUPLICATE_PUNCH)
      ) {
        finalOutcome = "REJECTED";
      } else if (
        context.flags.includes(AttendanceFlag.OUTSIDE_GEOFENCE) ||
        context.flags.includes(AttendanceFlag.GPS_UNAVAILABLE) ||
        context.flags.includes(AttendanceFlag.LOW_CONFIDENCE) ||
        context.flags.includes(AttendanceFlag.CLOCK_DRIFT)
      ) {
        finalOutcome = "ACCEPTED_WITH_WARNING";
      }

      context.outcome = finalOutcome;
    }

    // 2. Build final standard punch result object
    const finalType = context.resolvedPunchType || (context.currentLog ? "CHECK_OUT" : "CHECK_IN");

    context.result = {
      success: context.outcome !== "REJECTED",
      action: finalType === "CHECK_IN" ? "CHECK_IN" : "CHECK_OUT",
      status: context.resolvedStatus || "UNKNOWN",
      employee: context.employee
        ? { id: context.employee.id, employeeCode: context.employee.employeeCode, name: context.employee.name }
        : null,
      site: context.site ? { id: context.site.id, name: context.site.name } : null,
      flags: context.flags,
      warnings: context.warnings,
      occurredAt: context.input.capturedAt || context.trusted.receivedAt.toISOString(),
      requestId: context.requestId,
    };
  }
}
