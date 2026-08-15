import { PunchStage } from "../engine/pipeline";
import { PunchContext } from "../engine/context";
import { AttendanceEngineRepository } from "../repository/attendance-engine.repository";
import { PunchResult } from "../types";

export class IdempotencyStage implements PunchStage {
  async execute(context: PunchContext): Promise<void> {
    // If we already resolved a rejection in TenantStage, we can skip idempotency check or run it. Let's run it.
    const clientEventId = context.input.clientEventId;
    if (!clientEventId) return;

    const existingEvent = await AttendanceEngineRepository.findEventByIdempotency(
      context.trusted.organizationId,
      clientEventId
    );

    if (existingEvent) {
      context.isIdempotentRepeat = true;
      if (existingEvent.resultSnapshot) {
        context.originalResult = existingEvent.resultSnapshot as PunchResult;
      }
    }
  }
}
