"use client";

import { useEffect, useState } from "react";

type LeaveTypeUI = {
  id: string; code: string; name: string; isPaid: boolean;
  annualAllowance: number; requiresApproval: boolean; status: string;
};

export default function LeaveTypesPage() {
  const [types, setTypes] = useState<LeaveTypeUI[]>([]);

  useEffect(() => {
    async function load() {
      const res = await fetch("/api/leave/types");
      if (res.ok) {
        const data = await res.json();
        setTypes(data.data || []);
      }
    }
    load();
  }, []);

  return (
    <div className="bg-[#121214] border border-zinc-800 rounded-xl overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="text-xs text-zinc-400 bg-zinc-900/50 uppercase border-b border-zinc-800">
            <tr>
              <th className="px-6 py-4 font-medium">Code</th>
              <th className="px-6 py-4 font-medium">Name</th>
              <th className="px-6 py-4 font-medium">Paid</th>
              <th className="px-6 py-4 font-medium">Allowance</th>
              <th className="px-6 py-4 font-medium">Approval Req</th>
              <th className="px-6 py-4 font-medium">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800">
            {types.map((t) => (
              <tr key={t.id} className="hover:bg-zinc-800/50 transition-colors">
                <td className="px-6 py-4 font-mono text-zinc-300">{t.code}</td>
                <td className="px-6 py-4 text-white">{t.name}</td>
                <td className="px-6 py-4 text-zinc-300">{t.isPaid ? "Yes" : "No"}</td>
                <td className="px-6 py-4 text-zinc-300">{t.annualAllowance} days</td>
                <td className="px-6 py-4 text-zinc-300">{t.requiresApproval ? "Yes" : "No"}</td>
                <td className="px-6 py-4">
                  <span className="px-2 py-1 bg-zinc-800 text-zinc-300 rounded text-xs">
                    {t.status}
                  </span>
                </td>
              </tr>
            ))}
            {types.length === 0 && (
              <tr>
                <td colSpan={6} className="px-6 py-8 text-center text-zinc-500">
                  No leave types configured
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

