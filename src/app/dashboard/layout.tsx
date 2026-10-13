import { ReactNode } from "react";
import { requireTenantContext } from "@/lib/auth";
import { db } from "@/db";
import { users, organizations } from "@/db/schema";
import { eq } from "drizzle-orm";
import { AppShell } from "@/components/layout/app-shell";
import { OperationsService } from "@/modules/operations/service/operations.service";
import { PermissionService } from "@/lib/rbac";

const navItems = [
  { label: "Overview", href: "/dashboard", icon: "LayoutDashboard", permission: "attendance.read" as const },
  { label: "Attendance", href: "/dashboard/attendance", icon: "Clock", permission: "attendance.read" as const },
  { label: "Employees", href: "/dashboard/employees", icon: "Users2", permission: "employee.read" as const },
  { label: "Sites", href: "/dashboard/sites", icon: "MapPin", permission: "site.read" as const },
  { label: "Operations", href: "/dashboard/operations", icon: "AlertCircle", permission: "attendance.update" as const, hasBadge: true },
  { label: "Leave", href: "/dashboard/leave", icon: "Calendar", permission: "leave.read" as const },
  { label: "Payroll", href: "/dashboard/payroll", icon: "CreditCard", permission: "payroll.read" as const },
  { label: "Reports", href: "/dashboard/reports", icon: "FileText", permission: "report.read" as const },
  { label: "Settings", href: "/dashboard/settings", icon: "Settings", permission: "settings.read" as const },
];

export default async function DashboardLayout({ children }: { children: ReactNode }) {
  const session = await requireTenantContext();

  const [userRecord, orgRecord] = await Promise.all([
    db.query.users.findFirst({ where: eq(users.id, session.userId) }),
    db.query.organizations.findFirst({ where: eq(organizations.id, session.organizationId) })
  ]);

  let operationsCount = 0;
  if (PermissionService.can(session, "attendance.update")) {
    try {
      const anomalies = await OperationsService.getAnomalies(session.organizationId);
      operationsCount = anomalies.length;
    } catch (err) {
      // ignore
    }
  }

  const topbarUser = {
    name: userRecord?.name || "User",
    email: userRecord?.email || "",
    role: session.role,
    isPlatformUser: session.isPlatformUser,
    supportTenantId: session.supportTenantId || null,
  };

  const allowedNavigation = navItems.filter(item => PermissionService.can(session, item.permission));

  return (
    <AppShell 
      user={topbarUser} 
      navigation={allowedNavigation} 
      title={orgRecord?.name || "Workspace"}
      operationsCount={operationsCount}
    >
      <div className="p-4 md:p-6 lg:p-8 max-w-7xl mx-auto">{children}</div>
    </AppShell>
  );
}
