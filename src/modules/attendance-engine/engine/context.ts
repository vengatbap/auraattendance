import { organizations, employees, sites, attendanceLogs, attendanceEvents } from "@/db/schema";
import { PunchInput, TrustedAttendanceContext, PunchResult, AttendanceFlag, AttendanceEventType, AttendanceOutcome } from "../types";

export type OrganizationEntity = typeof organizations.$inferSelect;
export type EmployeeEntity = typeof employees.$inferSelect;
export type SiteEntity = typeof sites.$inferSelect;
export type AttendanceLogEntity = typeof attendanceLogs.$inferSelect;
export type AttendanceEventEntity = typeof attendanceEvents.$inferSelect;

export interface PunchContext {
  requestId: string;
  input: PunchInput;
  trusted: TrustedAttendanceContext;

  organization?: OrganizationEntity;
  employee?: EmployeeEntity;
  site?: SiteEntity;

  gpsDistanceMeters?: number;

  faceDistance?: number;
  faceThreshold?: number;
  faceMatchPassed?: boolean;

  currentLog?: AttendanceLogEntity;

  resolvedPunchType?: "CHECK_IN" | "CHECK_OUT";
  resolvedStatus?: "PRESENT" | "LATE" | "EARLY" | "OVERTIME" | "UNKNOWN";
  outcome?: AttendanceOutcome;

  flags: AttendanceFlag[];
  warnings: string[];

  attendanceEvent?: AttendanceEventEntity;
  attendanceLog?: AttendanceLogEntity;

  isIdempotentRepeat: boolean;
  originalResult?: PunchResult;
  result?: PunchResult;
}
