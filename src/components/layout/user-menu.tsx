"use client";

import { useState, useRef, useEffect } from "react";
import { ChevronDown, LogOut, Settings, User as UserIcon, Shield } from "lucide-react";
import { useRouter } from "next/navigation";

interface UserMenuProps {
  user: {
    name: string;
    email: string;
    role: string;
    isPlatformUser?: boolean;
    supportTenantId?: string | null;
  };
}

export function UserMenu({ user }: UserMenuProps) {
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    const handleOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, []);

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.href = "/login";
  };

  const handleExitSupport = async () => {
    await fetch("/api/admin/tenants/exit", { method: "POST" });
    window.location.href = "/admin";
  };

  const isSupportMode = user.isPlatformUser && user.supportTenantId;

  return (
    <div className="relative" ref={menuRef}>
      <button 
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 hover:bg-zinc-800/50 p-1.5 pr-2 rounded-full transition-colors cursor-pointer"
        aria-label="User menu"
        aria-expanded={open}
      >
        <div className="w-7 h-7 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs font-bold">
          {user.name.charAt(0).toUpperCase()}
        </div>
        <div className="hidden md:flex flex-col items-start mr-1">
          <span className="text-sm font-semibold text-zinc-200 leading-none">{user.name}</span>
          <span className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider mt-0.5">{user.role}</span>
        </div>
        <ChevronDown className="w-3.5 h-3.5 text-zinc-500" />
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-64 bg-[#18181b] border border-zinc-800 rounded-xl shadow-xl overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="p-4 border-b border-zinc-800 bg-zinc-900/50">
            <p className="text-sm font-bold text-white truncate">{user.name}</p>
            <p className="text-xs text-zinc-400 truncate mt-0.5">{user.email}</p>
            <div className="mt-2 inline-flex items-center px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-widest bg-blue-500/10 text-blue-400 border border-blue-500/20">
              {user.isPlatformUser && !isSupportMode ? "Platform Administrator" : user.role}
            </div>
          </div>
          
          <div className="p-1.5">
            <button className="w-full flex items-center gap-3 px-3 py-2 text-sm text-zinc-300 hover:bg-zinc-800 hover:text-white rounded-lg transition-colors text-left">
              <UserIcon className="w-4 h-4 text-zinc-500" /> Profile
            </button>
            <button className="w-full flex items-center gap-3 px-3 py-2 text-sm text-zinc-300 hover:bg-zinc-800 hover:text-white rounded-lg transition-colors text-left">
              <Settings className="w-4 h-4 text-zinc-500" /> Account Settings
            </button>
          </div>

          {isSupportMode && (
            <div className="p-1.5 border-t border-zinc-800">
              <div className="px-3 py-2 text-xs font-medium text-amber-500 mb-1">
                ⚠ Support Mode Active
              </div>
              <button 
                onClick={handleExitSupport}
                className="w-full flex items-center gap-3 px-3 py-2 text-sm text-rose-400 hover:bg-rose-500/10 hover:text-rose-300 rounded-lg transition-colors text-left font-medium"
              >
                <Shield className="w-4 h-4" /> Exit Support Mode
              </button>
            </div>
          )}

          <div className="p-1.5 border-t border-zinc-800">
            <button 
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-3 py-2 text-sm text-zinc-300 hover:bg-zinc-800 hover:text-white rounded-lg transition-colors text-left"
            >
              <LogOut className="w-4 h-4 text-zinc-500" /> Logout
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
