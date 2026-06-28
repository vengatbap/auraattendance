export type UserRole = "super_admin" | "admin";
export type EmployeeStatus = "active" | "inactive" | "resigned";
export type AttendanceStatus = "present" | "late" | "absent";
export type SiteStatus = "active" | "inactive";

export interface User {
  id: string;
  organizationId: string | null;
  email: string;
  name: string;
  role: UserRole;
  createdAt: Date;
  updatedAt: Date;
}

export interface Site {
  id: string;
  organizationId: string | null;
  name: string;
  latitude: number;
  longitude: number;
  radius: number;
  status: SiteStatus;
  allowedDevices: "browser" | "both" | "kiosk" | "tablet";
  createdAt: Date;
  updatedAt: Date;
}

export interface Employee {
  id: string;
  organizationId: string | null;
  employeeCode: string;
  governmentId: string;
  name: string;
  siteId: string | null;
  department: string | null;
  departmentId?: string | null;
  designation: string | null;
  phone: string | null;
  email: string | null;
  status: EmployeeStatus;
  enrollmentPhoto: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface FaceProfile {
  id: string;
  organizationId: string | null;
  employeeId: string;
  embedding: number[];
  version: number;
  isActive: boolean;
  createdAt: Date;
}

export interface AttendanceLog {
  id: string;
  organizationId: string | null;
  employeeId: string;
  siteId: string | null;
  date: string;
  checkInTime: Date | null;
  checkOutTime: Date | null;
  status: AttendanceStatus;
  deviceInfo: string | null;
  browser: string | null;
  photoUrl: string | null;
  confidenceScore: number | null;
  gpsDistanceMeters: number | null;
  gpsLatitude: number | null;
  gpsLongitude: number | null;
  ipAddress: string | null;
  punchType: string | null;
  createdAt: Date;
  updatedAt: Date;
  employee?: Employee;
  site?: Site;
}

export interface DashboardStats {
  totalEmployees: number;
  presentToday: number;
  absentToday: number;
  checkedIn: number;
  checkedOut: number;
  lateToday: number;
  siteWise: { siteName: string; count: number }[];
  recentActivity: AttendanceLog[];
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface ApiError {
  error: string;
  details?: unknown;
}

export interface SessionPayload {
  userId: string;
  role: UserRole;
  organizationId: string | null;
  iat?: number;
  exp?: number;
}

export interface RecognitionResult {
  matched: boolean;
  employee?: Employee;
  site?: Site;
  confidenceScore?: number;
  attendanceLog?: AttendanceLog;
}
