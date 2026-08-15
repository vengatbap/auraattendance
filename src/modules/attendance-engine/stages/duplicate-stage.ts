import { PunchStage } from "../engine/pipeline";
import { PunchContext } from "../engine/context";
import { AttendanceEngineRepository } from "../repository/attendance-engine.repository";
import { AttendanceFlag } from "../types";

export class DuplicateStage implements PunchStage {
  async execute(context: PunchContext): Promise<void> {
    if (context.outcome === "REJECTED" || !context.employee || !context.resolvedPunchType) return;

    const orgId = context.trusted.organizationId;
    const employeeId = context.employee.id;
    const gapMinutes = context.organization?.minimumPunchGapMinutes ?? 5;
    const tz = context.organization?.timezone || "UTC";

    // Format organization local date to check today's log events
    const dateString = this.getOrgDateString(context.trusted.receivedAt, tz);
    const recentEvents = await AttendanceEngineRepository.findRecentEvents(orgId, employeeId, dateString);

    const nowTime = context.input.capturedAt 
      ? new Date(context.input.capturedAt).getTime() 
      : context.trusted.receivedAt.getTime();

    for (const event of recentEvents) {
      if (
        (event.outcome === "ACCEPTED" || event.outcome === "ACCEPTED_WITH_WARNING") &&
        event.eventType === context.resolvedPunchType
      ) {
        const eventTime = new Date(event.capturedAt || event.receivedAt).getTime();
        const diffMs = Math.abs(nowTime - eventTime);
        const diffMins = diffMs / (1000 * 60);

        if (diffMins < gapMinutes) {
          context.flags.push(AttendanceFlag.DUPLICATE_PUNCH);
          context.outcome = "REJECTED";
          context.warnings.push(
            `Duplicate punch attempt of type ${context.resolvedPunchType} within guard interval (${diffMins.toFixed(1)} mins elapsed, limit is ${gapMinutes} mins)`
          );
          break;
        }
      }
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
