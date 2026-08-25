export const permissions = [
  "attendance.read",
  "attendance.create",
  "attendance.update",
  "attendance.adjust",

  "employee.read",
  "employee.create",
  "employee.update",
  "employee.archive",

  "site.read",
  "site.create",
  "site.update",
  "site.archive",

  "department.read",
  "department.create",
  "department.update",
  "department.archive",

  "report.read",
  "report.export",

  "user.read",
  "user.invite",
  "user.update",
  "user.archive",

  "settings.read",
  "settings.update",

  "leave.read",
  "leave.create",
  "leave.update",
  "leave.submit",
  "leave.approve",
  "leave.reject",
  "leave.cancel",
  "leave.manage_types",
  "leave.manage_balances",

  "payroll.read",
  "payroll.create",
  "payroll.calculate",
  "payroll.approve",
  "payroll.pay",
  "payroll.lock",
  "payroll.settings",
  "payroll.salary.read",
  "payroll.salary.update",
  "payroll.payslip.read",
  "payroll.export",

  // Platform Permissions (Super Admin/Operators only)
  "platform.dashboard.read",
  "platform.organizations.read",
  "platform.organizations.update",
  "platform.users.read",
  "platform.users.update",
  "platform.system.read",
  "platform.features.update",
] as const;

export type Permission = typeof permissions[number];

export const ROLE_PERMISSIONS: Record<string, Permission[]> = {
  super_admin: [
    "attendance.read",
    "attendance.create",
    "attendance.update",
    "attendance.adjust",
    "employee.read",
    "employee.create",
    "employee.update",
    "employee.archive",
    "site.read",
    "site.create",
    "site.update",
    "site.archive",
    "department.read",
    "department.create",
    "department.update",
    "department.archive",
    "report.read",
    "report.export",
    "user.read",
    "user.invite",
    "user.update",
    "user.archive",
    "settings.read",
    "settings.update",
    "leave.read",
    "leave.create",
    "leave.update",
    "leave.submit",
    "leave.approve",
    "leave.reject",
    "leave.cancel",
    "leave.manage_types",
    "leave.manage_balances",
    "payroll.read",
    "payroll.create",
    "payroll.calculate",
    "payroll.approve",
    "payroll.pay",
    "payroll.lock",
    "payroll.settings",
    "payroll.salary.read",
    "payroll.salary.update",
    "payroll.payslip.read",
    "payroll.export",
  ],
  admin: [
    "attendance.read",
    "attendance.create",
    "attendance.update",
    "attendance.adjust",
    "employee.read",
    "employee.create",
    "employee.update",
    "employee.archive",
    "site.read",
    "site.create",
    "site.update",
    "site.archive",
    "department.read",
    "department.create",
    "department.update",
    "department.archive",
    "report.read",
    "report.export",
    "user.read",
    "user.invite",
    "user.update",
    "user.archive",
    "settings.read",
    "settings.update",
    "leave.read",
    "leave.create",
    "leave.update",
    "leave.submit",
    "leave.approve",
    "leave.reject",
    "leave.cancel",
    "leave.manage_types",
    "leave.manage_balances",
    "payroll.read",
    "payroll.create",
    "payroll.calculate",
    "payroll.approve",
    "payroll.pay",
    "payroll.lock",
    "payroll.settings",
    "payroll.salary.read",
    "payroll.salary.update",
    "payroll.payslip.read",
    "payroll.export",
  ],
  manager: [
    "attendance.read",
    "attendance.create",
    "attendance.update",
    "employee.read",
    "employee.create",
    "employee.update",
    "site.read",
    "department.read",
    "report.read",
    "report.export",
    "settings.read",
    "leave.read",
    "leave.create",
    "leave.submit",
    "leave.approve",
    "leave.reject",
    "leave.cancel",
    "payroll.read",
  ],
  viewer: [
    "attendance.read",
    "employee.read",
    "site.read",
    "department.read",
    "report.read",
    "settings.read",
    "leave.read",
  ],
};

export class PermissionService {
  static can(
    user: { role: string; isPlatformUser?: boolean } | null | undefined,
    action: Permission
  ): boolean {
    if (!user) return false;

    // Platform permissions require isPlatformUser to be true
    if (action.startsWith("platform.")) {
      return user.isPlatformUser === true;
    }

    // Platform users must rely on their assigned role for tenant permissions in Support Mode
    // No automatic wildcard granting.

    const allowed = ROLE_PERMISSIONS[user.role] || [];
    return allowed.includes(action);
  }

  static cannot(
    user: { role: string; isPlatformUser?: boolean } | null | undefined,
    action: Permission
  ): boolean {
    return !this.can(user, action);
  }
}
