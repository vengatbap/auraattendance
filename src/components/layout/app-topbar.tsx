"use client";

import { ReactNode } from "react";
import { Bell, Search } from "lucide-react";
import { UserMenu } from "./user-menu";

interface AppTopbarProps {
  title: string;
  subtitle?: string;
  user: any;
  isSupportMode?: boolean;
}

export function AppTopbar({ title, subtitle, user, isSupportMode }: AppTopbarProps) {
  return (
    <header className="h-14 bg-[#0c0c0e]/95 border-b border-zinc-900 backdrop-blur-md flex items-center justify-between px-4 lg:px-6 sticky top-0 z-40">
      
      {/* Left: Branding & Context */}
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-blue-600/10 border border-blue-500/20 flex items-center justify-center text-blue-500 shadow-sm">
          <span className="text-sm font-black tracking-tight">A</span>
        </div>
        <div className="hidden sm:flex flex-col">
          <span className="text-sm font-bold text-zinc-100 leading-tight">Aura Attendance</span>
          <span className="text-[10px] font-semibold text-zinc-500 uppercase tracking-widest">{title}</span>
        </div>
        {isSupportMode && (
          <div className="ml-2 px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-500 text-[9px] font-black tracking-widest uppercase flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
            Support Mode
          </div>
        )}
      </div>

      {/* Center: Search / Command */}
      <div className="flex-1 max-w-md mx-4 hidden md:block">
        <button 
          onClick={() => document.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', metaKey: true }))}
          className="w-full flex items-center justify-between bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 rounded-lg px-3 py-1.5 text-sm text-zinc-400 transition-colors cursor-text"
        >
          <div className="flex items-center gap-2">
            <Search className="w-4 h-4 text-zinc-500" />
            <span>Search...</span>
          </div>
          <kbd className="hidden sm:inline-flex h-5 items-center gap-1 rounded border border-zinc-700 bg-zinc-800 px-1.5 font-mono text-[10px] font-medium text-zinc-400">
            <span className="text-xs">⌘</span>K
          </kbd>
        </button>
      </div>

      {/* Right: Actions & Profile */}
      <div className="flex items-center gap-2 sm:gap-4">
        <button className="hidden sm:flex w-8 h-8 items-center justify-center rounded-full hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 transition-colors relative">
          <Bell className="w-4 h-4" />
          {/* Unread dot */}
          <span className="absolute top-2 right-2 w-1.5 h-1.5 bg-rose-500 rounded-full border border-[#0c0c0e]"></span>
        </button>
        <div className="w-px h-5 bg-zinc-800 hidden sm:block"></div>
        <UserMenu user={user} />
      </div>

    </header>
  );
}
