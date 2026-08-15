"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Loader, RefreshCw, ClipboardList, Search } from "lucide-react";

interface AuditLog {
  id: string;
  action: string;
  entity: string;
  entityId: string | null;
  details: unknown;
  createdAt: string;
  organizationName: string | null;
  userEmail: string | null;
}

export default function AdminAuditPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  async function fetchLogs(showLoading = false) {
    if (showLoading) setLoading(true);
    try {
      const res = await fetch("/api/admin/audit");
      if (!res.ok) throw new Error();
      const body = await res.json();
      setLogs(body.data || []);
    } catch {
      toast.error("Failed to load platform audit logs");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchLogs(false);
  }, []);

  const filteredLogs = logs.filter((log) =>
    [
      log.action,
      log.entity,
      log.organizationName || "Platform",
      log.userEmail || "System",
      JSON.stringify(log.details || {}),
    ].some((val) => val.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-white">Platform Audit Log</h1>
          <p className="text-zinc-500 mt-1 text-sm">Review global configuration updates, plan changes, and security adjustments.</p>
        </div>
        <Button
          onClick={() => fetchLogs(true)}
          variant="outline"
          className="border-zinc-800 text-zinc-300 hover:bg-zinc-900 cursor-pointer"
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh Logs
        </Button>
      </div>

      <div className="flex gap-4 items-center">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-3 w-4 h-4 text-zinc-600" />
          <input
            placeholder="Search action, entity, tenant, details..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-zinc-950/50 border border-zinc-900 focus:border-zinc-800 rounded-xl pl-9 pr-4 py-2.5 text-xs text-zinc-200 outline-none placeholder:text-zinc-700"
          />
        </div>
      </div>

      <Card className="bg-[#0e0e11] border-zinc-900 rounded-2xl shadow-md">
        <CardHeader>
          <CardTitle className="text-sm font-bold text-white flex items-center gap-2">
            <ClipboardList className="w-4.5 h-4.5 text-amber-500" />
            Compliance Log History
          </CardTitle>
          <CardDescription className="text-xs text-zinc-500">
            Latest platform events: {filteredLogs.length}
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0 border-t border-zinc-900">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader className="w-6 h-6 animate-spin text-amber-500" />
            </div>
          ) : filteredLogs.length === 0 ? (
            <div className="text-center py-12 text-zinc-600 text-xs font-semibold">No logs found</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-zinc-950/40 text-[10px] font-black text-zinc-500 uppercase tracking-wider border-b border-zinc-900">
                  <tr>
                    <th className="py-3 px-6">Timestamp</th>
                    <th className="py-3 px-6">Organization</th>
                    <th className="py-3 px-6">Operator</th>
                    <th className="py-3 px-6">Action / Entity</th>
                    <th className="py-3 px-6">Event Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-900">
                  {filteredLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-zinc-950/20 transition-colors">
                      <td className="py-4 px-6 text-zinc-400 font-mono whitespace-nowrap">
                        {new Date(log.createdAt).toLocaleString()}
                      </td>
                      <td className="py-4 px-6 font-bold text-zinc-200">
                        {log.organizationName || <span className="text-zinc-600 italic">Platform Level</span>}
                      </td>
                      <td className="py-4 px-6 text-zinc-300 font-mono">
                        {log.userEmail || <span className="text-zinc-600 italic">System / Employee</span>}
                      </td>
                      <td className="py-4 px-6">
                        <div className="font-bold text-zinc-200 uppercase tracking-wider text-[10px]">
                          {log.action.replace(/_/g, " ")}
                        </div>
                        <div className="text-[9px] text-zinc-500 font-mono mt-0.5">{log.entity}</div>
                      </td>
                      <td className="py-4 px-6 text-zinc-400 font-mono max-w-xs truncate">
                        {log.details ? JSON.stringify(log.details) : <span className="text-zinc-600 italic">none</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
