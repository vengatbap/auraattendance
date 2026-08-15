import { PunchStage } from "../engine/pipeline";
import { PunchContext } from "../engine/context";
import { AttendanceEngineRepository } from "../repository/attendance-engine.repository";

export class AttendanceStateStage implements PunchStage {
  async execute(context: PunchContext): Promise<void> {
    if (context.outcome === "REJECTED" || !context.employee) return;

    const orgId = context.trusted.organizationId;
    const employeeId = context.employee.id;
    const tz = context.organization?.timezone || "UTC";

    // Format organization local date
    const dateString = this.getOrgDateString(context.trusted.receivedAt, tz);

    // Look up today's log to determine punch type
    const openLog = await AttendanceEngineRepository.findOpenAttendanceLog(orgId, employeeId, dateString);

    if (openLog && openLog.checkInTime && !openLog.checkOutTime) {
      context.resolvedPunchType = "CHECK_OUT";
      context.currentLog = openLog;
    } else {
      context.resolvedPunchType = "CHECK_IN";
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
