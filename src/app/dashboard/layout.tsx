"use client";

import { ReactNode, useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Users,
  MapPin,
  Users2,
  Clock,
  PencilLine,
  FileText,
  Settings,
  LogOut,
  Menu,
  X,
  Network,
  Shield,
} from "lucide-react";

const navItems = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Admins", href: "/dashboard/admins", icon: Users },
  { label: "Sites", href: "/dashboard/sites", icon: MapPin },
  { label: "Departments", href: "/dashboard/departments", icon: Network },
  { label: "Employees", href: "/dashboard/employees", icon: Users2 },
  { label: "Attendance", href: "/dashboard/attendance", icon: Clock },
  { label: "Adjustments", href: "/dashboard/attendance/adjustments", icon: PencilLine },
  { label: "Reports", href: "/dashboard/reports", icon: FileText },
  { label: "Settings", href: "/dashboard/settings", icon: Settings },
];

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [user, setUser] = useState<{ name: string; role: string; email: string } | null>(null);

  useEffect(() => {
    async function loadUser() {
      try {
        const res = await fetch("/api/auth/me");
        if (res.ok) {
          const data = await res.json();
          setUser(data.user);
        }
      } catch (err) {
        console.error(err);
      }
    }
    loadUser();
  }, []);

  return (
    <div className="flex h-screen bg-[#09090b] text-[#fafafa] font-sans antialiased">
      {/* Sidebar */}
      <aside
        className={cn(
          "fixed md:static inset-y-0 left-0 z-40 w-64 bg-[#0c0c0e] border-r border-zinc-900 transition-transform duration-200",
          !sidebarOpen && "-translate-x-full md:translate-x-0"
        )}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="p-6 border-b border-zinc-900">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-white shadow-sm">
                <span className="text-base font-extrabold tracking-tight bg-gradient-to-br from-white to-zinc-400 bg-clip-text text-transparent">A</span>
              </div>
              <span className="text-base font-black tracking-widest text-white">AURA</span>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto p-4 space-y-1">
            {navItems
              .filter((item) => {
                if (!user) return true;
                const role = user.role;
                if (role === "viewer") {
                  return !["Admins", "Adjustments", "Settings"].includes(item.label);
                }
                if (role === "manager") {
                  return !["Admins", "Settings"].includes(item.label);
                }
                return true;
              })
              .map((item) => {
                const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setSidebarOpen(false)}
                    className={cn(
                      "flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition-all duration-150 text-xs font-semibold",
                      isActive
                        ? "bg-[#18181b] text-white border border-zinc-850/50 shadow-sm"
                        : "text-zinc-400 hover:bg-zinc-900/50 hover:text-zinc-200"
                    )}
                  >
                    <Icon className={cn("w-4.5 h-4.5 transition-colors", isActive ? "text-zinc-200" : "text-zinc-500")} />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
          </nav>

          {/* Footer */}
          <div className="p-4 border-t border-zinc-900 space-y-1.5">
            <Link
              href="/dashboard/profile"
              className={cn(
                "flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition-all duration-150 text-xs font-semibold",
                pathname === "/dashboard/profile"
                  ? "bg-[#18181b] text-white border border-zinc-850/50 shadow-sm"
                  : "text-zinc-400 hover:bg-zinc-900/50 hover:text-zinc-200"
              )}
            >
              <Users className="w-4.5 h-4.5 text-zinc-500" />
              <span>Profile</span>
            </Link>
            <Button
              type="button"
              variant="ghost"
              onClick={async () => {
                await fetch("/api/auth/logout", { method: "POST" });
                window.location.href = "/login";
              }}
              className="w-full justify-start gap-3 px-3.5 py-2.5 h-auto text-xs font-semibold rounded-xl text-zinc-400 hover:bg-zinc-900/50 hover:text-zinc-200 cursor-pointer"
            >
              <LogOut className="w-4.5 h-4.5 text-zinc-500" />
              <span>Logout</span>
            </Button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Bar */}
        <header className="h-14 bg-[#0c0c0e]/80 border-b border-zinc-900 backdrop-blur-md flex items-center justify-between px-6 z-10">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="md:hidden text-zinc-400 hover:text-zinc-200"
          >
            {sidebarOpen ? (
              <X className="w-5 h-5" />
            ) : (
              <Menu className="w-5 h-5" />
            )}
          </button>
          <div className="flex-1" />
          <div className="flex items-center gap-4">
            {user?.role === "super_admin" && (
              <Link href="/admin/dashboard">
                <Button size="sm" className="bg-amber-600/10 hover:bg-amber-600/20 text-amber-500 border border-amber-500/20 text-[10px] h-7 rounded-lg font-bold flex items-center gap-1.5 cursor-pointer">
                  <Shield className="w-3.5 h-3.5" />
                  Admin Panel
                </Button>
              </Link>
            )}
            <div className="text-right">
              <div className="text-xs font-bold text-zinc-200">{user?.name || "Loading..."}</div>
              <div className="text-[9px] text-zinc-500 uppercase tracking-widest font-black mt-0.5">
                {user?.role === "super_admin"
                  ? "Platform Admin"
                  : user?.role === "admin"
                  ? "Administrator"
                  : user?.role === "manager"
                  ? "Manager"
                  : user?.role === "viewer"
                  ? "Viewer"
                  : ""}
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-auto bg-[#09090b]">
          <div className="p-6 max-w-7xl mx-auto">{children}</div>
        </main>
      </div>

      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div
          className="md:hidden fixed inset-0 z-30 bg-black/60 backdrop-blur-sm"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
}
