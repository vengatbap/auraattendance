import { attendanceLogs } from "@/db/schema";

export type AttendanceLogEntity = typeof attendanceLogs.$inferSelect;
export type CreateAttendanceLogInput = typeof attendanceLogs.$inferInsert;

export interface AttendancePunchResult {
  action: "check_in" | "check_out" | "already_checked_out";
  matched: boolean;
  employee: {
    id: string;
    name: string;
    employeeCode: string;
  };
  site: {
    id: string | null;
    name: string;
    matched: boolean;
    nearestSiteName?: string | null;
  };
  attendanceLog: AttendanceLogEntity;
  faceScore: number;
  distanceMeters: number | null;
  locationMatched: boolean;
  latitude: number;
  longitude: number;
}
