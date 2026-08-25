"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";

export function CommandBar() {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
      if (e.key === "Escape") {
        setOpen(false);
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-start justify-center pt-[15vh]">
      <div className="bg-[#0e0e11] border border-zinc-800 shadow-2xl rounded-xl w-full max-w-2xl overflow-hidden flex flex-col">
        <div className="flex items-center px-4 py-3 border-b border-zinc-800">
          <Search className="w-5 h-5 text-zinc-500 mr-3" />
          <input
            autoFocus
            className="flex-1 bg-transparent text-white outline-none placeholder:text-zinc-500 text-sm"
            placeholder="Type a command or search..."
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                // simple quick nav for now
                const val = e.currentTarget.value.toLowerCase();
                if (val.includes("employee")) router.push("/dashboard/employees");
                else if (val.includes("attendance")) router.push("/dashboard/attendance");
                else if (val.includes("leave")) router.push("/dashboard/leave");
                else if (val.includes("payroll")) router.push("/dashboard/payroll");
                else if (val.includes("report")) router.push("/dashboard/reports");
                setOpen(false);
              }
            }}
          />
          <button onClick={() => setOpen(false)} className="text-[10px] bg-zinc-800 text-zinc-400 px-2 py-1 rounded">ESC</button>
        </div>
        <div className="p-2">
          <div className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider px-3 py-2">Quick Links</div>
          <button onClick={() => { router.push("/dashboard/employees"); setOpen(false); }} className="w-full text-left px-3 py-2 text-sm text-zinc-300 hover:bg-zinc-800 hover:text-white rounded flex items-center justify-between">
            Employees <span className="text-zinc-500 text-xs">Jump to directory</span>
          </button>
          <button onClick={() => { router.push("/dashboard/attendance"); setOpen(false); }} className="w-full text-left px-3 py-2 text-sm text-zinc-300 hover:bg-zinc-800 hover:text-white rounded flex items-center justify-between">
            Attendance <span className="text-zinc-500 text-xs">Review logs</span>
          </button>
        </div>
      </div>
    </div>
  );
}
