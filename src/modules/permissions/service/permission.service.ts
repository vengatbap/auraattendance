import { PermissionAction, UserRole } from "../types";

export class PermissionService {
  private static rolePermissions: Record<UserRole, PermissionAction[]> = {
    super_admin: [
      "manage_organization",
      "manage_admins",
      "manage_employees",
      "manage_sites",
      "manage_departments",
      "create_adjustments",
      "view_audit_logs",
      "view_reports",
      "manage_api_keys",
      "manage_settings",
      "view_dashboard",
      "view_user",
      "create_user",
      "delete_user",
    ],
    admin: [
      "manage_organization",
      "manage_admins",
      "manage_employees",
      "manage_sites",
      "manage_departments",
      "create_adjustments",
      "view_audit_logs",
      "view_reports",
      "manage_settings",
      "view_dashboard",
      "view_user",
      "create_user",
      "delete_user",
    ],
    manager: [
      "manage_employees",
      "manage_sites",
      "manage_departments",
      "create_adjustments",
      "view_reports",
      "view_dashboard",
      "view_user",
    ],
    viewer: [
      "view_dashboard",
    ],
  };

  /**
   * Checks if a specific role is allowed to perform an action.
   */
  public static hasRolePermission(role: string | null | undefined, action: PermissionAction): boolean {
    if (!role) return false;
    const permissions = this.rolePermissions[role as UserRole];
    if (!permissions) return false;
    return permissions.includes(action);
  }

  /**
   * Checks permissions from session context.
   */
  public static hasPermission(
    session: { role: string; organizationId: string | null } | null,
    action: PermissionAction
  ): boolean {
    if (!session) return false;
    
    const role = session.role as UserRole;
    return this.rolePermissions[role]?.includes(action) ?? false;
  }
}
