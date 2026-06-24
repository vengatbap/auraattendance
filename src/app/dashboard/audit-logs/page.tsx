"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Loader, Search } from "lucide-react";
import { toast } from "sonner";

interface AuditLog {
  id: string;
  userId: string;
  action: string;
  entity: string;
  entityId: string;
  details: unknown;
  createdAt: string;
}

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  async function fetchLogs() {
    try {
      const res = await fetch("/api/audit-logs?limit=200");
      if (!res.ok) throw new Error("Failed to fetch logs");
      const data = await res.json();
      setLogs(data);
    } catch {
      toast.error("Failed to load audit logs");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const t = setTimeout(() => {
      fetchLogs();
    }, 0);
    return () => clearTimeout(t);
  }, []);

  const filteredLogs = logs.filter((log) =>
    log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.entity.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Audit Logs</h1>
        <p className="text-slate-400 mt-2">System activity and user actions history</p>
      </div>

      <Card className="bg-slate-900 border-slate-800">
        <CardHeader>
          <CardTitle>Activity Log</CardTitle>
          <CardDescription>Total: {filteredLogs.length} records</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-3 w-4 h-4 text-slate-500" />
              <Input
                placeholder="Search action or entity..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-slate-950/50 border-slate-800 text-slate-100"
              />
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader className="w-6 h-6 animate-spin text-blue-600" />
            </div>
          ) : filteredLogs.length === 0 ? (
            <div className="text-center py-8 text-slate-400">No audit logs found</div>
          ) : (
            <div className="space-y-3">
              {filteredLogs.map((log) => (
                <div key={log.id} className="p-4 bg-slate-800/30 rounded-lg border border-slate-700">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-1 bg-blue-500/20 text-blue-400 rounded text-xs font-semibold">
                          {log.action}
                        </span>
                        <span className="text-slate-300 font-medium">{log.entity}</span>
                      </div>
                      <p className="text-sm text-slate-400 mt-1">
                        User: {log.userId || "System"}
                      </p>
                    </div>
                    <div className="text-sm text-slate-500">
                      {new Date(log.createdAt).toLocaleString()}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
