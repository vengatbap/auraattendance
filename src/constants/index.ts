export const DEFAULT_ORGANIZATION = {
  name: "AURA Demo Organization",
  slug: "aura-demo",
} as const;

export const SESSION_COOKIE_NAME = "session";

export const USER_ROLES = ["super_admin", "admin"] as const;
export const EMPLOYEE_STATUSES = ["active", "inactive", "resigned"] as const;
export const SITE_STATUSES = ["active", "inactive"] as const;
export const ATTENDANCE_STATUSES = ["present", "late", "absent"] as const;
export const ATTENDANCE_ADJUSTMENT_TYPES = [
  "check_in_time",
  "check_out_time",
  "mark_present",
  "mark_absent",
  "missed_punch",
] as const;
