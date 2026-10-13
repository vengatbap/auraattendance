"use client";

import { ReactNode, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Menu,
  X,
  LayoutDashboard,
  Users2,
  MapPin,
  Clock,
  FileText,
  Settings,
  Calendar,
  AlertCircle,
  CreditCard,
  Building2,
  Users,
  ToggleLeft,
  Database,
  ClipboardList,
  ScanFace,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { AppTopbar } from "./app-topbar";
import { CommandBar } from "./command-bar";

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  LayoutDashboard,
  Users2,
  MapPin,
  Clock,
  FileText,
  Settings,
  Calendar,
  AlertCircle,
  CreditCard,
  Building2,
  Users,
  ToggleLeft,
  Database,
  ClipboardList,
};

export interface NavItem {
  label: string;
  href: string;
  icon: string;
  hasBadge?: boolean;
}

interface AppShellProps {
  children: ReactNode;
  user: any;
  navigation: NavItem[];
  title: string;
  operationsCount?: number;
}

export function AppShell({ children, user, navigation, title, operationsCount = 0 }: AppShellProps) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen bg-[#09090b] text-[#fafafa] font-sans antialiased overflow-hidden">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={cn(
        "fixed inset-y-0 left-0 z-50 w-64 bg-[#0c0c0e] border-r border-zinc-900 flex flex-col transition-transform duration-300 lg:static lg:translate-x-0 shadow-2xl lg:shadow-none",
        sidebarOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        {/* Sidebar Brand Header (Desktop & Mobile) */}
        <div className="h-14 flex items-center justify-between px-4 border-b border-zinc-900/80 bg-zinc-950/40">
          <Link href={user?.isPlatformUser && !user?.supportTenantId ? "/admin/dashboard" : "/dashboard"} className="flex items-center gap-2.5">
            <div className="size-8 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-blue-600/20">
              <ScanFace className="size-4.5" />
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-extrabold tracking-tight text-white leading-tight">Aura</span>
              <span className="text-[10px] font-semibold text-zinc-500 uppercase tracking-widest leading-none">
                {user?.isPlatformUser && !user?.supportTenantId ? "Control Plane" : "Attendance"}
              </span>
            </div>
          </Link>

          <button
            onClick={() => setSidebarOpen(false)}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 lg:hidden cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Sidebar Nav Items */}
        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
          <div className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest px-3 mb-2">
            Main Menu
          </div>
          {navigation.map((item) => {
            const Icon = iconMap[item.icon] || LayoutDashboard;
            const isActive = pathname === item.href || (item.href !== "/dashboard" && item.href !== "/admin" && item.href !== "/admin/dashboard" && pathname.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setSidebarOpen(false)}
                className={cn(
                  "flex items-center justify-between px-3 py-2.5 rounded-xl transition-all text-xs font-semibold group",
                  isActive
                    ? "bg-blue-600 text-white font-bold shadow-md shadow-blue-600/20"
                    : "text-zinc-400 hover:bg-zinc-900/80 hover:text-zinc-100"
                )}
              >
                <div className="flex items-center gap-3">
                  <Icon className={cn("size-4 transition-transform group-hover:scale-105", isActive ? "text-white" : "text-zinc-500 group-hover:text-zinc-300")} />
                  <span>{item.label}</span>
                </div>
                {item.hasBadge && operationsCount > 0 && (
                  <span className={cn(
                    "text-[10px] font-extrabold px-2 py-0.5 rounded-full",
                    isActive ? "bg-white text-blue-600" : "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                  )}>
                    {operationsCount}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Sidebar Footer Link */}
        <div className="p-3 border-t border-zinc-900/80 bg-zinc-950/30">
          <Link
            href="/attendance"
            target="_blank"
            className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-xs font-bold text-zinc-300 hover:text-white transition-colors shadow-sm"
          >
            <ScanFace className="size-3.5 text-blue-400" />
            Launch Kiosk Screen
          </Link>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <AppTopbar 
          title={title} 
          user={user} 
          isSupportMode={user?.isPlatformUser && !!user?.supportTenantId}
        />
        
        {/* Floating Mobile Navigation Button */}
        <div className="lg:hidden fixed bottom-6 right-6 z-50">
           <button 
            onClick={() => setSidebarOpen(true)}
            className="size-12 bg-blue-600 hover:bg-blue-500 rounded-full flex items-center justify-center text-white shadow-2xl shadow-blue-900/40 border border-blue-400/30 cursor-pointer active:scale-95 transition-transform"
            aria-label="Open sidebar navigation"
           >
             <Menu className="size-5" />
           </button>
        </div>

        <main className="flex-1 overflow-auto relative">
          {children}
        </main>
      </div>

      <CommandBar />
    </div>
  );
}
