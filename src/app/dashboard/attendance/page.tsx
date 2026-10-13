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
import { Download, Loader, PencilLine, Search, Clock, MapPin, ShieldCheck, Filter, Calendar } from "lucide-react";
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

  const fetchData = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("date_filter", dateFilter);
      if (dateFilter === "custom") {
        if (customStartDate) params.set("start_date", customStartDate);
        if (customEndDate) params.set("end_date", customEndDate);
      }
      if (siteId && siteId !== "all") {
        params.set("site_id", siteId);
      }
      if (searchTerm) {
        params.set("search", searchTerm);
      }

      const [attendanceRes, sitesRes] = await Promise.all([
        fetch(`/api/attendance?${params.toString()}`),
        fetch("/api/sites")
      ]);

      if (!attendanceRes.ok) throw new Error("Failed to fetch attendance");
      const attendanceData = await attendanceRes.json();
      setRows(attendanceData.rows || []);

      if (sitesRes.ok) {
        const sitesData = await sitesRes.json();
        setSites(sitesData.sites || []);
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to load records");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [dateFilter, customStartDate, customEndDate, siteId]);

  // Debounced search trigger
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchData();
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const exportHref = useMemo(() => {
    const params = new URLSearchParams();
    params.set("type", "attendance");
    params.set("date_filter", dateFilter);
    if (dateFilter === "custom") {
      if (customStartDate) params.set("start_date", customStartDate);
      if (customEndDate) params.set("end_date", customEndDate);
    }
    if (siteId && siteId !== "all") {
      params.set("site_id", siteId);
    }
    return `/api/reports/export?${params.toString()}`;
  }, [dateFilter, customStartDate, customEndDate, siteId]);

  return (
    <div className="space-y-6">
      {/* Top Banner Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-gradient-to-r from-zinc-900/80 via-zinc-900/40 to-transparent p-6 rounded-3xl border border-zinc-800 backdrop-blur-sm">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-zinc-400 uppercase tracking-widest">
            <span>Attendance Management</span>
            <span>•</span>
            <span className="text-blue-400">Live Verification Logs</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight mt-1">
            Attendance Records
          </h1>
          <p className="text-sm text-zinc-400 mt-1">
            Search, review, and manually adjust employee punch timestamps and site validations.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link href="/dashboard/attendance/adjustments">
            <Button variant="outline" className="h-10 px-4 rounded-xl border-zinc-700 bg-zinc-800/60 hover:bg-zinc-800 text-zinc-200 text-xs font-semibold">
              Adjustment History
            </Button>
          </Link>
          <Link href={exportHref}>
            <Button className="h-10 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm">
              <Download className="size-3.5" /> Export CSV
            </Button>
          </Link>
        </div>
      </div>

      {/* Main Table Card */}
      <div className="rounded-3xl border border-zinc-800 bg-[#0c0c0e] overflow-hidden shadow-xl p-5 space-y-4">
        {/* Filters Bar */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[220px]">
            <Search className="absolute left-3.5 top-3 size-4 text-zinc-500" />
            <Input
              placeholder="Search by employee name or code..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="border-zinc-800 bg-zinc-950/80 pl-10 text-sm text-zinc-100 rounded-xl h-10 placeholder:text-zinc-500 focus-visible:ring-blue-500"
            />
          </div>

          <div className="w-[160px]">
            <Select value={dateFilter} onValueChange={(v) => setDateFilter(v as DateFilterType)}>
              <SelectTrigger className="border-zinc-800 bg-zinc-950/80 text-zinc-200 rounded-xl h-10 text-xs font-semibold">
                <SelectValue placeholder="Date Range" />
              </SelectTrigger>
              <SelectContent className="border-zinc-800 bg-zinc-900 text-zinc-200">
                <SelectItem value="today">Today</SelectItem>
                <SelectItem value="yesterday">Yesterday</SelectItem>
                <SelectItem value="this_week">This Week</SelectItem>
                <SelectItem value="this_month">This Month</SelectItem>
                <SelectItem value="custom">Custom Range</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {dateFilter === "custom" && (
            <div className="flex items-center gap-2">
              <Input
                type="date"
                value={customStartDate}
                onChange={(e) => setCustomStartDate(e.target.value)}
                className="border-zinc-800 bg-zinc-950/80 text-zinc-200 rounded-xl h-10 text-xs w-auto"
              />
              <span className="text-zinc-500 text-xs">to</span>
              <Input
                type="date"
                value={customEndDate}
                onChange={(e) => setCustomEndDate(e.target.value)}
                className="border-zinc-800 bg-zinc-950/80 text-zinc-200 rounded-xl h-10 text-xs w-auto"
              />
            </div>
          )}

          <div className="w-[160px]">
            <Select value={siteId} onValueChange={(value) => setSiteId(value ?? "all")}>
              <SelectTrigger className="border-zinc-800 bg-zinc-950/80 text-zinc-200 rounded-xl h-10 text-xs font-semibold">
                <SelectValue placeholder="All Sites" />
              </SelectTrigger>
              <SelectContent className="border-zinc-800 bg-zinc-900 text-zinc-200">
                <SelectItem value="all">All Sites</SelectItem>
                {sites.map((site) => (
                  <SelectItem key={site.id} value={site.id}>
                    {site.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Content Area */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-16">
            <Loader className="size-8 animate-spin text-blue-500 mb-2" />
            <p className="text-xs text-zinc-500 font-medium">Loading attendance records...</p>
          </div>
        ) : rows.length === 0 ? (
          <div className="py-16 text-center text-zinc-500 text-sm">
            No attendance records found matching your active filters.
          </div>
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-zinc-800/80">
            <table className="w-full text-xs">
              <thead className="border-b border-zinc-800 bg-zinc-950/60 text-zinc-400">
                <tr>
                  <th className="px-4 py-3.5 text-left font-bold uppercase tracking-wider">Employee</th>
                  <th className="px-4 py-3.5 text-left font-bold uppercase tracking-wider">Site</th>
                  <th className="px-4 py-3.5 text-left font-bold uppercase tracking-wider">Check In</th>
                  <th className="px-4 py-3.5 text-left font-bold uppercase tracking-wider">Check Out</th>
                  <th className="px-4 py-3.5 text-left font-bold uppercase tracking-wider">Status & Verification</th>
                  <th className="px-4 py-3.5 text-right font-bold uppercase tracking-wider">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/60 bg-[#0c0c0e]">
                {rows.map(({ log, employee, site }) => (
                  <tr key={log.id} className="hover:bg-zinc-900/40 transition-colors">
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="size-8 rounded-full bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-white text-xs font-bold shrink-0">
                          {employee?.name?.charAt(0).toUpperCase() || "E"}
                        </div>
                        <div>
                          <p className="font-bold text-white text-sm">{employee?.name ?? "Unknown"}</p>
                          <p className="text-[11px] font-mono text-zinc-500">{employee?.employeeCode ?? "—"}</p>
                        </div>
                      </div>
                    </td>

                    <td className="px-4 py-3.5 text-zinc-300 font-medium">
                      <div className="flex items-center gap-1.5">
                        <MapPin className="size-3 text-zinc-500" />
                        <span>{site?.name ?? <span className="text-amber-400">Unknown</span>}</span>
                      </div>
                    </td>

                    <td className="px-4 py-3.5 text-zinc-300 font-mono font-medium">
                      {log.checkInTime ? new Date(log.checkInTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "—"}
                    </td>

                    <td className="px-4 py-3.5 text-zinc-300 font-mono font-medium">
                      {log.checkOutTime ? new Date(log.checkOutTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "—"}
                    </td>

                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-2">
                        <span
                          className={`rounded-full px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wider border ${
                            log.status === "present"
                              ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                              : log.status === "late"
                              ? "bg-amber-500/10 text-amber-400 border-amber-500/20"
                              : "bg-rose-500/10 text-rose-400 border-rose-500/20"
                          }`}
                        >
                          {log.status}
                        </span>

                        {log.confidenceScore !== null && (
                          <span className="text-[10px] font-mono bg-zinc-900 border border-zinc-800 text-zinc-400 px-2 py-0.5 rounded-full" title="Face confidence score">
                            {(log.confidenceScore * 100).toFixed(0)}% Face
                          </span>
                        )}

                        {log.gpsDistanceMeters !== null && (
                          <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full border ${
                            log.gpsDistanceMeters > 500
                              ? "bg-amber-500/10 text-amber-400 border-amber-500/20"
                              : "bg-zinc-900 text-zinc-400 border-zinc-800"
                          }`} title="GPS distance">
                            {Math.round(log.gpsDistanceMeters)}m
                          </span>
                        )}
                      </div>
                    </td>

                    <td className="px-4 py-3.5 text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setCorrectionLog({ id: log.id, name: employee?.name || 'Unknown' })}
                        className="h-8 px-3 rounded-lg text-blue-400 hover:text-blue-300 hover:bg-blue-600/10 text-xs font-semibold cursor-pointer"
                      >
                        <PencilLine className="size-3.5 mr-1" />
                        Adjust
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      
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
