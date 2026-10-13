"use client";

import { useState, useRef, useEffect } from "react";
import { ChevronDown, LogOut, Settings, User as UserIcon, Shield, HelpCircle } from "lucide-react";
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

  const isSupportMode = user.isPlatformUser && !!user.supportTenantId;

  // Extract initials (e.g., "Vengatesan B" -> "VB")
  const initials = user.name
    ? user.name
        .split(" ")
        .map((n) => n[0])
        .slice(0, 2)
        .join("")
        .toUpperCase()
    : "U";

  return (
    <div className="relative" ref={menuRef}>
      <button 
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 hover:bg-zinc-800/60 p-1.5 pr-2 rounded-xl transition-colors cursor-pointer"
        aria-label="User menu"
        aria-expanded={open}
      >
        <div className="size-7 rounded-lg bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-white text-xs font-black shadow-sm">
          {initials}
        </div>
        <div className="hidden md:flex flex-col items-start mr-0.5">
          <span className="text-xs font-bold text-zinc-200 leading-none">{user.name}</span>
          <span className="text-[10px] text-zinc-500 uppercase font-semibold tracking-wider mt-0.5">
            {user.isPlatformUser && !isSupportMode ? "Platform Admin" : user.role}
          </span>
        </div>
        <ChevronDown className="size-3.5 text-zinc-500" />
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-60 bg-[#121215] border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-150">
          {/* User Header */}
          <div className="p-4 border-b border-zinc-800 bg-zinc-950/50">
            <p className="text-sm font-bold text-white truncate">{user.name}</p>
            <p className="text-xs text-zinc-400 truncate mt-0.5">{user.email}</p>
            <div className="mt-2 inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-widest bg-blue-500/10 text-blue-400 border border-blue-500/20">
              {user.isPlatformUser && !isSupportMode ? "Platform Administrator" : user.role}
            </div>
          </div>
          
          {/* Menu Actions */}
          <div className="p-1.5 space-y-0.5 text-xs font-semibold text-zinc-300">
            <button 
              onClick={() => { setOpen(false); router.push(user.isPlatformUser && !isSupportMode ? "/admin/system" : "/dashboard/profile"); }}
              className="w-full flex items-center gap-2.5 px-3 py-2 hover:bg-zinc-800/80 hover:text-white rounded-xl transition-colors text-left cursor-pointer"
            >
              <UserIcon className="size-4 text-zinc-500" /> Profile
            </button>
            <button 
              onClick={() => { setOpen(false); router.push(user.isPlatformUser && !isSupportMode ? "/admin/system" : "/dashboard/settings"); }}
              className="w-full flex items-center gap-2.5 px-3 py-2 hover:bg-zinc-800/80 hover:text-white rounded-xl transition-colors text-left cursor-pointer"
            >
              <Settings className="size-4 text-zinc-500" /> Settings
            </button>
            <button 
              onClick={() => { setOpen(false); router.push("/faq"); }}
              className="w-full flex items-center gap-2.5 px-3 py-2 hover:bg-zinc-800/80 hover:text-white rounded-xl transition-colors text-left cursor-pointer"
            >
              <HelpCircle className="size-4 text-zinc-500" /> Help & Documentation
            </button>
          </div>

          {/* Support Mode Exit Option */}
          {isSupportMode && (
            <div className="p-1.5 border-t border-zinc-800 bg-amber-500/5">
              <div className="px-3 py-1.5 text-[11px] font-bold text-amber-400 flex items-center gap-1.5">
                <Shield className="size-3.5" /> Support Mode Active
              </div>
              <button 
                onClick={handleExitSupport}
                className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-rose-400 hover:bg-rose-500/10 hover:text-rose-300 rounded-xl transition-colors text-left font-bold cursor-pointer"
              >
                Exit Support Mode
              </button>
            </div>
          )}

          {/* Logout */}
          <div className="p-1.5 border-t border-zinc-800">
            <button 
              onClick={handleLogout}
              className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-zinc-400 hover:bg-rose-500/10 hover:text-rose-400 rounded-xl transition-colors text-left font-semibold cursor-pointer"
            >
              <LogOut className="size-4" /> Logout
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
