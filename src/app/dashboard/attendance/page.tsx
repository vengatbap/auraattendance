"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Download, Loader, PencilLine, Search } from "lucide-react";
import { toast } from "sonner";
import { AttendanceCorrectionModal } from "./AttendanceCorrectionModal";

interface AttendanceRow {
  log: {
    id: string;
    date: string;
    checkInTime: string | null;
    checkOutTime: string | null;
    status: string;
    confidenceScore: number | null;
    gpsDistanceMeters: number | null;
    gpsLatitude: number | null;
    gpsLongitude: number | null;
    browser: string | null;
  };
  employee: {
    id: string;
    employeeCode: string;
    name: string;
  } | null;
  site: {
    id: string;
    name: string;
  } | null;
}

interface Site {
  id: string;
  name: string;
  status: string;
}

type DateFilterType = "today" | "yesterday" | "this_week" | "this_month" | "custom";

export default function AttendancePage() {
  const [rows, setRows] = useState<AttendanceRow[]>([]);
  const [sites, setSites] = useState<Site[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  
  const [dateFilter, setDateFilter] = useState<DateFilterType>("today");
  const [customStartDate, setCustomStartDate] = useState("");
  const [customEndDate, setCustomEndDate] = useState("");

  const [siteId, setSiteId] = useState("all");

  const [correctionLog, setCorrectionLog] = useState<{ id: string; name: string } | null>(null);

  const query = useMemo(() => {
    const params = new URLSearchParams({ limit: "100" });

    const today = new Date();
    
    if (dateFilter === "today") {
      params.set("date", today.toISOString().split("T")[0]);
    } else if (dateFilter === "yesterday") {
      const yesterday = new Date(today);
      yesterday.setDate(today.getDate() - 1);
      params.set("date", yesterday.toISOString().split("T")[0]);
    } else if (dateFilter === "this_week") {
      const startOfWeek = new Date(today);
      startOfWeek.setDate(today.getDate() - today.getDay());
      params.set("startDate", startOfWeek.toISOString().split("T")[0]);
      params.set("endDate", today.toISOString().split("T")[0]);
    } else if (dateFilter === "this_month") {
      const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
      params.set("startDate", startOfMonth.toISOString().split("T")[0]);
      params.set("endDate", today.toISOString().split("T")[0]);
    } else if (dateFilter === "custom") {
      if (customStartDate) params.set("startDate", customStartDate);
      if (customEndDate) params.set("endDate", customEndDate);
    }

    if (siteId !== "all") params.set("siteId", siteId);
    if (searchTerm.trim()) params.set("search", searchTerm.trim());
    return params.toString();
  }, [dateFilter, customStartDate, customEndDate, searchTerm, siteId]);

  async function fetchData() {
    setLoading(true);
    try {
      const [logsRes, sitesRes] = await Promise.all([
        fetch(`/api/attendance?${query}`),
        fetch("/api/sites"),
      ]);
      if (!logsRes.ok) throw new Error("Failed to fetch logs");
      if (!sitesRes.ok) throw new Error("Failed to fetch sites");
      const [logsData, sitesData] = await Promise.all([logsRes.json(), sitesRes.json()]);
      setRows(logsData.data || logsData); // Handle wrapped response
      setSites(sitesData.data || sitesData); // Handle wrapped response
    } catch {
      toast.error("Failed to load attendance");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const t = setTimeout(fetchData, 250);
    return () => clearTimeout(t);
  }, [query]);

  const exportHref = `/api/reports/export?type=daily&format=csv&${query}`;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Attendance Records</h1>
          <p className="mt-2 text-slate-400">View and adjust employee attendance</p>
        </div>
        <div className="flex gap-2">
          <Link href="/dashboard/attendance/adjustments">
            <Button variant="outline" className="border-slate-700 text-slate-300">
              Adjustment Logs
            </Button>
          </Link>
          <Link href={exportHref}>
            <Button variant="outline" className="border-slate-700 text-slate-300">
              <Download className="mr-2 h-4 w-4" />
              CSV
            </Button>
          </Link>
        </div>
      </div>

      <Card className="border-slate-800 bg-slate-900">
        <CardHeader>
          <CardTitle>Attendance</CardTitle>
          <CardDescription>{rows.length} records</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-3">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-3 h-4 w-4 text-slate-500" />
              <Input
                placeholder="Search employee, code, or site"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                className="border-slate-800 bg-slate-950/50 pl-10 text-slate-100"
              />
            </div>
            
            <div className="w-[180px]">
              <Select value={dateFilter} onValueChange={(v) => setDateFilter(v as DateFilterType)}>
                <SelectTrigger className="border-slate-800 bg-slate-950/50 text-slate-100">
                  <SelectValue placeholder="Date range" />
                </SelectTrigger>
                <SelectContent className="border-slate-800 bg-slate-900">
                  <SelectItem value="today" className="text-slate-100">Today</SelectItem>
                  <SelectItem value="yesterday" className="text-slate-100">Yesterday</SelectItem>
                  <SelectItem value="this_week" className="text-slate-100">This Week</SelectItem>
                  <SelectItem value="this_month" className="text-slate-100">This Month</SelectItem>
                  <SelectItem value="custom" className="text-slate-100">Custom Range</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {dateFilter === "custom" && (
              <div className="flex items-center gap-2">
                <Input
                  type="date"
                  value={customStartDate}
                  onChange={(e) => setCustomStartDate(e.target.value)}
                  className="border-slate-800 bg-slate-950/50 text-slate-100 w-auto"
                />
                <span className="text-slate-500">-</span>
                <Input
                  type="date"
                  value={customEndDate}
                  onChange={(e) => setCustomEndDate(e.target.value)}
                  className="border-slate-800 bg-slate-950/50 text-slate-100 w-auto"
                />
              </div>
            )}

            <div className="w-[180px]">
              <Select value={siteId} onValueChange={(value) => setSiteId(value ?? "all")}>
                <SelectTrigger className="border-slate-800 bg-slate-950/50 text-slate-100">
                  <SelectValue placeholder="All sites" />
                </SelectTrigger>
                <SelectContent className="border-slate-800 bg-slate-900">
                  <SelectItem value="all" className="text-slate-100">All sites</SelectItem>
                  {sites.map((site) => (
                    <SelectItem key={site.id} value={site.id} className="text-slate-100">
                      {site.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader className="h-6 w-6 animate-spin text-blue-600" />
            </div>
          ) : rows.length === 0 ? (
            <div className="py-8 text-center text-slate-400">No attendance records found</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b border-slate-700">
                  <tr>
                    <th className="px-4 py-3 text-left font-semibold">Date & Employee</th>
                    <th className="px-4 py-3 text-left font-semibold">Site</th>
                    <th className="px-4 py-3 text-left font-semibold">Check In</th>
                    <th className="px-4 py-3 text-left font-semibold">Check Out</th>
                    <th className="px-4 py-3 text-left font-semibold">Status</th>
                    <th className="px-4 py-3 text-right font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map(({ log, employee, site }) => (
                    <tr key={log.id} className="border-b border-slate-800 hover:bg-slate-800/50">
                      <td className="px-4 py-3">
                        <div className="text-xs text-slate-500 mb-1">{log.date}</div>
                        <div className="font-medium text-slate-200">{employee?.name ?? "Unknown"}</div>
                        <div className="text-xs text-slate-500">{employee?.employeeCode ?? log.id}</div>
                      </td>
                      <td className="px-4 py-3 text-slate-400">
                        {site?.name ?? <span className="text-amber-400">Unknown location</span>}
                      </td>
                      <td className="px-4 py-3 text-slate-400">
                        {log.checkInTime ? new Date(log.checkInTime).toLocaleTimeString() : "-"}
                      </td>
                      <td className="px-4 py-3 text-slate-400">
                        {log.checkOutTime ? new Date(log.checkOutTime).toLocaleTimeString() : "-"}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`rounded px-2 py-1 text-xs font-semibold ${
                            log.status === "present"
                              ? "bg-green-500/20 text-green-400"
                              : log.status === "late"
                              ? "bg-yellow-500/20 text-yellow-400"
                              : "bg-red-500/20 text-red-400"
                          }`}
                        >
                          {log.status}
                        </span>
                        
                        {(log.confidenceScore !== null || log.gpsDistanceMeters !== null) && (
                          <div className="mt-2 flex gap-1 flex-wrap">
                            {log.confidenceScore !== null && (
                              <span className="text-[10px] bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded" title="Face Match Score">
                                👱 {(log.confidenceScore * 100).toFixed(0)}%
                              </span>
                            )}
                            {log.gpsDistanceMeters !== null && (
                              <span className="text-[10px] bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded" title="GPS Distance from Site">
                                📍 {Math.round(log.gpsDistanceMeters)}m
                              </span>
                            )}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setCorrectionLog({ id: log.id, name: employee?.name || 'Unknown' })}
                          className="text-blue-400 hover:text-blue-300 hover:bg-blue-900/30"
                        >
                          <PencilLine className="h-4 w-4 mr-1" />
                          Adjust
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
      
      {correctionLog && (
        <AttendanceCorrectionModal
          isOpen={!!correctionLog}
          onClose={() => setCorrectionLog(null)}
          logId={correctionLog.id}
          employeeName={correctionLog.name}
          onSuccess={fetchData}
        />
      )}
    </div>
  );
}
