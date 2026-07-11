import { ReactNode } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import {
  LayoutDashboard,
  Building2,
  Users,
  CreditCard,
  ToggleLeft,
  LogOut,
  ArrowLeft,
} from "lucide-react";

const adminNavItems = [
  { label: "Overview", href: "/admin/dashboard", icon: LayoutDashboard },
  { label: "Tenants", href: "/admin/tenants", icon: Building2 },
  { label: "Users", href: "/admin/users", icon: Users },
  { label: "Products", href: "/admin/products", icon: CreditCard },
  { label: "Feature Flags", href: "/admin/features", icon: ToggleLeft },
];

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const session = await getSession();

  if (!session || session.role !== "super_admin") {
    redirect("/dashboard");
  }

  return (
    <div className="flex h-screen bg-[#09090b] text-[#fafafa] font-sans antialiased">
      {/* Sidebar */}
      <aside className="w-64 bg-[#0c0c0e] border-r border-zinc-900 flex flex-col h-full">
        {/* Logo */}
        <div className="p-6 border-b border-zinc-900">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-600/10 border border-amber-500/20 flex items-center justify-center text-amber-500 shadow-sm">
              <span className="text-base font-extrabold tracking-tight">S</span>
            </div>
            <span className="text-base font-black tracking-widest text-amber-500">SUPER PANEL</span>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto p-4 space-y-1">
          {adminNavItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition-all duration-150 text-xs font-semibold text-zinc-400 hover:bg-zinc-900/50 hover:text-zinc-200"
              >
                <Icon className="w-4.5 h-4.5 text-zinc-500" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-zinc-900 space-y-1.5">
          <Link href="/dashboard">
            <Button
              variant="ghost"
              className="w-full justify-start gap-3 px-3.5 py-2.5 h-auto text-xs font-semibold rounded-xl text-zinc-400 hover:bg-zinc-900/50 hover:text-zinc-200 cursor-pointer"
            >
              <ArrowLeft className="w-4.5 h-4.5 text-zinc-500" />
              <span>Back to App</span>
            </Button>
          </Link>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Bar */}
        <header className="h-14 bg-[#0c0c0e]/80 border-b border-zinc-900 backdrop-blur-md flex items-center justify-between px-6 z-10">
          <div className="text-xs font-bold text-amber-500 uppercase tracking-widest">Platform Administration Console</div>
          <div className="text-right">
            <div className="text-xs font-bold text-zinc-200">Global Administrator</div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-auto bg-[#09090b]">
          <div className="p-6 max-w-7xl mx-auto">{children}</div>
        </main>
      </div>
    </div>
  );
}
