"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

type LeaveRequestUI = {
  request: { id: string; startDate: string; endDate: string; requestedDays: number; status: string; };
  employee: { firstName: string; lastName: string; };
  type: { name: string; };
};

export default function LeaveRequestsPage() {
  const [requests, setRequests] = useState<LeaveRequestUI[]>([]);

  useEffect(() => {
    async function load() {
      const res = await fetch("/api/leave/requests");
      if (res.ok) {
        const data = await res.json();
        setRequests(data.data || []);
      }
    }
    load();
  }, []);

  const handleAction = async (id: string, action: string) => {
    const res = await fetch(`/api/leave/requests/${id}/${action}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(action === "reject" ? { reason: "Rejected by admin" } : {}),
    });
    if (res.ok) {
      window.location.reload();
    }
  };

  return (
    <div className="bg-[#121214] border border-zinc-800 rounded-xl overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="text-xs text-zinc-400 bg-zinc-900/50 uppercase border-b border-zinc-800">
            <tr>
              <th className="px-6 py-4 font-medium">Employee</th>
              <th className="px-6 py-4 font-medium">Type</th>
              <th className="px-6 py-4 font-medium">Dates</th>
              <th className="px-6 py-4 font-medium">Days</th>
              <th className="px-6 py-4 font-medium">Status</th>
              <th className="px-6 py-4 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800">
            {requests.map((r) => (
              <tr key={r.request.id} className="hover:bg-zinc-800/50 transition-colors">
                <td className="px-6 py-4 text-white">
                  {r.employee.firstName} {r.employee.lastName}
                </td>
                <td className="px-6 py-4 text-zinc-300">{r.type.name}</td>
                <td className="px-6 py-4 text-zinc-300">
                  {r.request.startDate} to {r.request.endDate}
                </td>
                <td className="px-6 py-4 text-zinc-300">{r.request.requestedDays}</td>
                <td className="px-6 py-4">
                  <span className="px-2 py-1 bg-zinc-800 text-zinc-300 rounded text-xs">
                    {r.request.status}
                  </span>
                </td>
                <td className="px-6 py-4 text-right space-x-2">
                  {r.request.status === "PENDING" && (
                    <>
                      <Button size="sm" onClick={() => handleAction(r.request.id, "approve")} className="bg-emerald-600/10 text-emerald-500 hover:bg-emerald-600/20">Approve</Button>
                      <Button size="sm" onClick={() => handleAction(r.request.id, "reject")} className="bg-red-600/10 text-red-500 hover:bg-red-600/20">Reject</Button>
                    </>
                  )}
                  {r.request.status === "APPROVED" && (
                     <Button size="sm" onClick={() => handleAction(r.request.id, "cancel")} className="bg-orange-600/10 text-orange-500 hover:bg-orange-600/20">Cancel</Button>
                  )}
                </td>
              </tr>
            ))}
            {requests.length === 0 && (
              <tr>
                <td colSpan={6} className="px-6 py-8 text-center text-zinc-500">
                  No requests found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

