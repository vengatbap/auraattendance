import { ReactNode } from "react";
import { requirePlatformAccess } from "@/lib/auth";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { AppShell } from "@/components/layout/app-shell";

const adminNavItems = [
  { label: "Overview", href: "/admin/dashboard", icon: "LayoutDashboard" },
  { label: "Tenants", href: "/admin/tenants", icon: "Building2" },
  { label: "Users", href: "/admin/users", icon: "Users" },
  { label: "Products", href: "/admin/products", icon: "CreditCard" },
  { label: "Feature Flags", href: "/admin/features", icon: "ToggleLeft" },
  { label: "System Status", href: "/admin/system", icon: "Database" },
  { label: "Audit Logs", href: "/admin/audit", icon: "ClipboardList" },
];

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const session = await requirePlatformAccess();

  // Fetch complete user data for the topbar
  const userRecord = await db.query.users.findFirst({
    where: eq(users.id, session.userId),
  });

  const topbarUser = {
    name: userRecord?.name || "Global Administrator",
    email: userRecord?.email || "admin@platform",
    role: "Platform Administrator",
    isPlatformUser: true,
    supportTenantId: null
  };

  return (
    <AppShell 
      user={topbarUser} 
      navigation={adminNavItems} 
      title="Platform Control Plane"
    >
      <div className="p-4 md:p-8 max-w-7xl mx-auto">{children}</div>
    </AppShell>
  );
}
