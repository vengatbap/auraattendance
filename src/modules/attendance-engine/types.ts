
export const AttendanceEventType = {
  CHECK_IN: "CHECK_IN",
  CHECK_OUT: "CHECK_OUT",
  REJECTED_DUPLICATE: "REJECTED_DUPLICATE",
  REJECTED_FACE: "REJECTED_FACE",
  REJECTED_EMPLOYEE: "REJECTED_EMPLOYEE",
  REJECTED_TENANT: "REJECTED_TENANT",
  REJECTED_POLICY: "REJECTED_POLICY",
} as const;
export type AttendanceEventType = typeof AttendanceEventType[keyof typeof AttendanceEventType];

export type AttendanceOutcome = "ACCEPTED" | "ACCEPTED_WITH_WARNING" | "REJECTED";

export const AttendanceFlag = {
  LOW_CONFIDENCE: "LOW_CONFIDENCE",
  OUTSIDE_GEOFENCE: "OUTSIDE_GEOFENCE",
  DUPLICATE_PUNCH: "DUPLICATE_PUNCH",
  OFFLINE_SYNC: "OFFLINE_SYNC",
  SHIFT_UNKNOWN: "SHIFT_UNKNOWN",
  FACE_NOT_REGISTERED: "FACE_NOT_REGISTERED",
  REJECTED_TENANT: "REJECTED_TENANT",
  GPS_UNAVAILABLE: "GPS_UNAVAILABLE",
  CLOCK_DRIFT: "CLOCK_DRIFT",
} as const;
export type AttendanceFlag = typeof AttendanceFlag[keyof typeof AttendanceFlag];

export interface PunchInput {
  clientEventId: string;
  kioskToken?: string;
  employeeCode?: string;
  employeeId?: string;
  authMethod?: "FACE" | "PIN" | "FINGERPRINT" | "SUPERVISOR";
  pin?: string;
  faceMatchPassed?: boolean;
  descriptor?: number[];
  photoUrl?: string;
  latitude?: number;
  longitude?: number;
  deviceInfo?: string;
  browser?: string;
  capturedAt: string; // ISO string representing browser event time
  isOffline?: boolean;
}

export interface TrustedAttendanceContext {
  organizationId: string;
  kioskId?: string;
  allowedSiteId?: string;
  requestId: string;
  ipAddress: string;
  receivedAt: Date;
}

export interface PunchResult {
  success: boolean;
  action: AttendanceEventType;
  status: "PRESENT" | "LATE" | "EARLY" | "OVERTIME" | "UNKNOWN";
  employee: {
    id: string;
    employeeCode: string;
    name: string;
  } | null;
  site: {
    id: string;
    name: string;
  } | null;
  flags: AttendanceFlag[];
  warnings: string[];
  occurredAt: string;
  requestId: string;
  errorCode?: string;
  errorMessage?: string;
}
