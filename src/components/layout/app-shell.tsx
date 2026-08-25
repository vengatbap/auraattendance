"use client";

import { ReactNode, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { AppTopbar } from "./app-topbar";
import { CommandBar } from "./command-bar";

interface NavItem {
  label: string;
  href: string;
  icon: any;
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
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={cn(
        "fixed inset-y-0 left-0 z-50 w-64 bg-[#0c0c0e] border-r border-zinc-900 flex flex-col transition-transform duration-300 lg:static lg:translate-x-0",
        sidebarOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        {/* Mobile close button */}
        <div className="h-14 flex items-center justify-between px-4 border-b border-zinc-900 lg:hidden">
          <span className="font-bold text-sm tracking-widest text-zinc-400">MENU</span>
          <button onClick={() => setSidebarOpen(false)} className="p-1 rounded-md text-zinc-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Sidebar Nav */}
        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1 mt-2 lg:mt-14">
          <div className="text-[10px] font-black text-zinc-600 uppercase tracking-widest px-3 mb-2">Navigation</div>
          {navigation.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || (item.href !== "/dashboard" && item.href !== "/admin" && pathname.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setSidebarOpen(false)}
                className={cn(
                  "flex items-center justify-between px-3 py-2 rounded-lg transition-colors text-sm font-medium",
                  isActive
                    ? "bg-zinc-800/50 text-white font-semibold"
                    : "text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200"
                )}
              >
                <div className="flex items-center gap-3">
                  <Icon className={cn("w-4.5 h-4.5", isActive ? "text-blue-500" : "text-zinc-500")} />
                  <span>{item.label}</span>
                </div>
                {item.hasBadge && operationsCount > 0 && (
                  <span className="bg-amber-500/20 text-amber-500 text-[10px] font-black px-1.5 py-0.5 rounded">
                    {operationsCount}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <AppTopbar 
          title={title} 
          user={user} 
          isSupportMode={user?.isPlatformUser && !!user?.supportTenantId}
        />
        
        {/* Mobile Header (replaces topbar on small screens somewhat, but topbar is sticky. We just need the hamburger menu) */}
        <div className="lg:hidden fixed bottom-6 right-6 z-50">
           <button 
            onClick={() => setSidebarOpen(true)}
            className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center text-white shadow-xl shadow-blue-900/20 border border-blue-500/50"
           >
             <Menu className="w-5 h-5" />
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
