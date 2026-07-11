export type UserRole = "super_admin" | "admin" | "manager" | "viewer";

export type PermissionAction =
  | "manage_organization"
  | "manage_admins"
  | "manage_employees"
  | "manage_sites"
  | "manage_departments"
  | "create_adjustments"
  | "view_audit_logs"
  | "view_reports"
  | "manage_api_keys"
  | "manage_settings"
  | "view_dashboard"
  | "view_user"
  | "create_user"
  | "delete_user";
