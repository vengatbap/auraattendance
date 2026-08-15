import { PunchInput, TrustedAttendanceContext, PunchResult } from "../types";
import { PunchContext } from "./context";
import { PunchPipeline } from "./pipeline";
import { TenantStage } from "../stages/tenant-stage";
import { IdempotencyStage } from "../stages/idempotency-stage";
import { FaceIdentificationStage } from "../stages/face-identification-stage";
import { EmployeeValidationStage } from "../stages/employee-validation-stage";
import { GeofenceStage } from "../stages/geofence-stage";
import { AttendanceStateStage } from "../stages/attendance-state-stage";
import { DuplicateStage } from "../stages/duplicate-stage";
import { ShiftStage } from "../stages/shift-stage";
import { DecisionStage } from "../stages/decision-stage";
import { PersistStage } from "../stages/persist-stage";
import { AuditStage } from "../stages/audit-stage";

export class AttendanceEngine {
  static async processPunch(
    input: PunchInput,
    trusted: TrustedAttendanceContext
  ): Promise<PunchResult> {
    const context: PunchContext = {
      requestId: trusted.requestId,
      input,
      trusted,
      flags: [],
      warnings: [],
      isIdempotentRepeat: false,
    };

    const pipeline = new PunchPipeline([
      new TenantStage(),
      new IdempotencyStage(),
      new FaceIdentificationStage(),
      new EmployeeValidationStage(),
      new GeofenceStage(),
      new AttendanceStateStage(),
      new DuplicateStage(),
      new ShiftStage(),
      new DecisionStage(),
      new PersistStage(),
      new AuditStage(),
    ]);

    await pipeline.run(context);

    // If an idempotency conflict was identified, return original cached resultSnapshot
    if (context.isIdempotentRepeat && context.originalResult) {
      return context.originalResult;
    }

    if (!context.result) {
      throw new Error("Attendance Engine failed to resolve a final result payload");
    }

    return context.result;
  }
}
