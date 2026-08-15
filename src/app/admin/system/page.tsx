"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { toast } from "sonner";
import { Loader, RefreshCw, Database, Server, Cpu } from "lucide-react";

interface SystemHealth {
  status: "healthy" | "degraded" | "unhealthy";
  database: {
    connected: boolean;
    size: string;
    activeConnections: number;
  };
  environment: {
    nodeEnv: string;
    timezone: string;
  };
  system: {
    version: string;
    uptime: number;
  };
}

export default function AdminSystemPage() {
  const [health, setHealth] = useState<SystemHealth | null>(null);
  const [loading, setLoading] = useState(true);
  const [pinging, setPinging] = useState(false);

  async function fetchHealth(showLoading = false) {
    if (showLoading) setLoading(true);
    try {
      const res = await fetch("/api/admin/system");
      if (!res.ok) throw new Error();
      const body = await res.json();
      setHealth(body.data);
    } catch {
      toast.error("Failed to load system diagnostics report");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchHealth(false);
  }, []);

  async function handlePing() {
    setPinging(true);
    try {
      const start = Date.now();
      const res = await fetch("/api/admin/system");
      const duration = Date.now() - start;
      if (res.ok) {
        toast.success(`Ping check succeeded: DB response in ${duration}ms`);
      } else {
        throw new Error();
      }
    } catch {
      toast.error("Ping check failed. Database connectivity is disrupted!");
    } finally {
      setPinging(false);
    }
  }

  function formatUptime(seconds: number): string {
    const d = Math.floor(seconds / (3600 * 24));
    const h = Math.floor((seconds % (3600 * 24)) / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    return `${d}d ${h}h ${m}m ${s}s`;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-white">System Diagnostics</h1>
          <p className="text-zinc-500 mt-1 text-sm">Low-level platform metrics, databases, and environments diagnostics.</p>
        </div>
        <Button
          onClick={() => fetchHealth(true)}
          variant="outline"
          className="border-zinc-800 text-zinc-300 hover:bg-zinc-900 cursor-pointer"
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh Stats
        </Button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-24">
          <Loader className="w-8 h-8 animate-spin text-amber-500" />
        </div>
      ) : !health ? (
        <div className="text-center py-12 text-zinc-500 text-sm">Failed to retrieve system status data.</div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Health Summary Card */}
          <Card className="bg-[#0e0e11] border-zinc-900 rounded-2xl shadow-md lg:col-span-2">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <div>
                <CardTitle className="text-sm font-bold text-white">Platform Health Status</CardTitle>
                <CardDescription className="text-xs text-zinc-500">Realtime engine checks.</CardDescription>
              </div>
              <span
                className={`inline-flex px-3.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border ${
                  health.status === "healthy"
                    ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                    : health.status === "degraded"
                    ? "bg-amber-500/10 text-amber-400 border-amber-500/20"
                    : "bg-rose-500/10 text-rose-400 border-rose-500/20"
                }`}
              >
                {health.status}
              </span>
            </CardHeader>
            <CardContent className="py-4">
              <div className="text-zinc-400 text-xs">
                All platform interfaces are operating nominally. Database queries are passing latency checks.
              </div>
            </CardContent>
          </Card>

          {/* Database Diagnostics */}
          <Card className="bg-[#0e0e11] border-zinc-900 rounded-2xl shadow-md">
            <CardHeader>
              <CardTitle className="text-sm font-bold text-white flex items-center gap-2">
                <Database className="w-4.5 h-4.5 text-blue-500" />
                Neon PostgreSQL Database
              </CardTitle>
              <CardDescription className="text-xs text-zinc-500">Storage metrics and engine statistics.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 py-4 border-t border-zinc-900">
              <div className="flex justify-between items-center py-1">
                <span className="text-xs text-zinc-400">Database Connection</span>
                <span
                  className={`inline-flex px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider ${
                    health.database.connected
                      ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                      : "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                  }`}
                >
                  {health.database.connected ? "Connected" : "Disconnected"}
                </span>
              </div>
              <div className="flex justify-between items-center py-1">
                <span className="text-xs text-zinc-400">Database Disk Size</span>
                <span className="font-mono text-xs text-white">{health.database.size}</span>
              </div>
              <div className="flex justify-between items-center py-1">
                <span className="text-xs text-zinc-400">Active Connections</span>
                <span className="font-mono text-xs text-white">{health.database.activeConnections}</span>
              </div>
            </CardContent>
            <CardFooter className="border-t border-zinc-900/60 bg-zinc-950/20 py-3.5 flex justify-end">
              <Button
                onClick={handlePing}
                disabled={pinging || !health.database.connected}
                className="bg-zinc-900 border border-zinc-800 hover:bg-zinc-850 text-zinc-300 font-bold text-[10px] h-8 rounded-lg flex items-center gap-1.5 cursor-pointer"
              >
                <Server className="w-3.5 h-3.5" />
                {pinging ? "Pinging..." : "Test Latency Ping"}
              </Button>
            </CardFooter>
          </Card>

          {/* Node.js Process Diagnostics */}
          <Card className="bg-[#0e0e11] border-zinc-900 rounded-2xl shadow-md">
            <CardHeader>
              <CardTitle className="text-sm font-bold text-white flex items-center gap-2">
                <Cpu className="w-4.5 h-4.5 text-purple-500" />
                Application Process
              </CardTitle>
              <CardDescription className="text-xs text-zinc-500">Node.js environment metrics and build metadata.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 py-4 border-t border-zinc-900">
              <div className="flex justify-between items-center py-1">
                <span className="text-xs text-zinc-400">Environment Mode</span>
                <span className="font-mono text-xs text-white uppercase tracking-wider">{health.environment.nodeEnv}</span>
              </div>
              <div className="flex justify-between items-center py-1">
                <span className="text-xs text-zinc-400">Default Server Timezone</span>
                <span className="text-xs text-white font-semibold">{health.environment.timezone}</span>
              </div>
              <div className="flex justify-between items-center py-1">
                <span className="text-xs text-zinc-400">Active Process Uptime</span>
                <span className="text-xs text-white font-semibold">{formatUptime(health.system.uptime)}</span>
              </div>
              <div className="flex justify-between items-center py-1">
                <span className="text-xs text-zinc-400">Build Version Tag</span>
                <span className="font-mono text-xs text-amber-500 font-black">v{health.system.version}-v1_base</span>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
