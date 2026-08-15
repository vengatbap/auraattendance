import { PunchStage } from "../engine/pipeline";
import { PunchContext } from "../engine/context";
import { AttendanceFlag } from "../types";

export class ShiftStage implements PunchStage {
  async execute(context: PunchContext): Promise<void> {
    if (context.outcome === "REJECTED" || !context.resolvedPunchType) return;

    const org = context.organization;
    const tz = org?.timezone || "UTC";

    // Validate clock drift for both offline and online punches
    const capturedTimeStr = context.input.capturedAt;
    if (capturedTimeStr) {
      const capturedDate = new Date(capturedTimeStr);
      if (!isNaN(capturedDate.getTime())) {
        const skewMs = Math.abs(context.trusted.receivedAt.getTime() - capturedDate.getTime());
        const allowedSkewMs = 5 * 60 * 1000; // 5 minutes skew tolerance
        if (skewMs > allowedSkewMs) {
          context.flags.push(AttendanceFlag.CLOCK_DRIFT);
          context.warnings.push(`Clock drift detected: device time differs from server time by ${(skewMs / 1000 / 60).toFixed(1)} mins`);
        }
      }
    }

    if (context.resolvedPunchType === "CHECK_IN") {
      const lateAfterTime = org?.lateAfterTime; // e.g. "09:00"
      const gracePeriod = org?.gracePeriodMinutes ?? 0;

      if (!lateAfterTime) {
        context.resolvedStatus = "PRESENT";
        context.flags.push(AttendanceFlag.SHIFT_UNKNOWN);
        context.warnings.push("No lateAfterTime configuration defined; defaulting status to PRESENT");
        return;
      }

      // Check timezone time
      const timeToCompare = capturedTimeStr ? new Date(capturedTimeStr) : context.trusted.receivedAt;
      const localTime = this.getOrgLocalTime(timeToCompare, tz);

      const [thresholdHour, thresholdMinute] = lateAfterTime.split(":").map(Number);
      
      // Calculate total threshold minutes and current local minutes
      const thresholdMins = thresholdHour * 60 + thresholdMinute + gracePeriod;
      const localMins = localTime.hour * 60 + localTime.minute;

      if (localMins > thresholdMins) {
        context.resolvedStatus = "LATE";
      } else {
        context.resolvedStatus = "PRESENT";
      }
    } else {
      // CHECK_OUT punch status inherits or defaults to PRESENT
      context.resolvedStatus = "PRESENT";
    }
  }

  private getOrgLocalTime(date: Date, timezone: string): { hour: number; minute: number } {
    try {
      const formatter = new Intl.DateTimeFormat("en-US", {
        timeZone: timezone,
        hour: "numeric",
        minute: "2-digit",
        hour12: false,
      });
      const formattedString = formatter.format(date);
      const [hour, minute] = formattedString.split(":").map(Number);
      return { hour, minute };
    } catch {
      return { hour: date.getHours(), minute: date.getMinutes() };
    }
  }
}
