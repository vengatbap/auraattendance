"use client";

import { ReactNode } from "react";
import { Bell, Search, Shield, Building2, LogOut } from "lucide-react";
import { UserMenu } from "./user-menu";

interface AppTopbarProps {
  title: string;
  subtitle?: string;
  user: any;
  isSupportMode?: boolean;
}

export function AppTopbar({ title, subtitle, user, isSupportMode }: AppTopbarProps) {
  const handleExitSupport = async () => {
    await fetch("/api/admin/tenants/exit", { method: "POST" });
    window.location.href = "/admin";
  };

  return (
    <div className="sticky top-0 z-40 flex flex-col">
      {/* Super Admin Support Mode Top Alert Strip */}
      {isSupportMode && (
        <div className="h-8 bg-amber-500/15 border-b border-amber-500/30 px-4 lg:px-6 flex items-center justify-between text-xs font-bold text-amber-400 backdrop-blur-md">
          <div className="flex items-center gap-2">
            <Shield className="size-3.5 animate-pulse text-amber-400" />
            <span className="uppercase tracking-wider text-[11px]">Support Mode:</span>
            <span className="text-zinc-200 font-semibold">Viewing as Tenant ({title})</span>
          </div>
          <button
            onClick={handleExitSupport}
            className="px-2.5 py-0.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-[10px] font-black uppercase tracking-wider transition-colors cursor-pointer"
          >
            Exit Support Mode
          </button>
        </div>
      )}

      <header className="h-14 bg-[#0c0c0e]/95 border-b border-zinc-900/80 backdrop-blur-md flex items-center justify-between px-4 lg:px-6">
        {/* Left: Organization Context */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-zinc-900/60 border border-zinc-800/80 text-xs font-semibold text-zinc-200">
            <Building2 className="size-3.5 text-zinc-400" />
            <span className="truncate max-w-[180px] sm:max-w-[260px] font-bold">{title}</span>
          </div>
        </div>

        {/* Center: Search / Command Palette Trigger */}
        <div className="flex-1 max-w-md mx-4 hidden md:block">
          <button 
            onClick={() => document.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', metaKey: true }))}
            className="w-full flex items-center justify-between bg-zinc-900/80 hover:bg-zinc-800/80 border border-zinc-800/80 rounded-xl px-3.5 py-1.5 text-xs text-zinc-400 transition-colors cursor-text shadow-inner"
          >
            <div className="flex items-center gap-2">
              <Search className="size-3.5 text-zinc-500" />
              <span>Search ⌘K</span>
            </div>
            <kbd className="hidden sm:inline-flex h-5 items-center gap-1 rounded-md border border-zinc-700 bg-zinc-800 px-1.5 font-mono text-[10px] font-bold text-zinc-400">
              <span>⌘</span>K
            </kbd>
          </button>
        </div>

        {/* Right: Actions & User Profile Menu */}
        <div className="flex items-center gap-3">
          <button 
            className="size-8 rounded-full hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 transition-colors relative flex items-center justify-center cursor-pointer"
            aria-label="Notifications"
          >
            <Bell className="size-4" />
            <span className="absolute top-1.5 right-1.5 size-2 bg-blue-500 rounded-full border-2 border-[#0c0c0e]" />
          </button>

          <div className="w-px h-5 bg-zinc-800 hidden sm:block" />

          <UserMenu user={user} />
        </div>
      </header>
    </div>
  );
}
