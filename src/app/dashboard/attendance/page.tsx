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

export default function AttendancePage() {
  const [rows, setRows] = useState<AttendanceRow[]>([]);
  const [sites, setSites] = useState<Site[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [date, setDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [siteId, setSiteId] = useState("all");

  const query = useMemo(() => {
    const params = new URLSearchParams({ limit: "100" });
    if (date) params.set("date", date);
    if (siteId !== "all") params.set("siteId", siteId);
    if (searchTerm.trim()) params.set("search", searchTerm.trim());
    return params.toString();
  }, [date, searchTerm, siteId]);

  async function fetchData() {
    setLoading(true);
    try {
      const [logsRes, sitesRes] = await Promise.all([
        fetch(`/api/attendance?${query}`),
        fetch("/api/sites"),
      ]);
      if (!logsRes.ok) throw new Error("Failed to fetch logs");
      if (!sitesRes.ok) throw new Error("Failed to fetch sites");
      setRows(await logsRes.json());
      setSites(await sitesRes.json());
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

  const exportHref = `/api/reports/export?type=daily&format=csv&date=${date}${siteId !== "all" ? `&siteId=${siteId}` : ""}`;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Attendance Records</h1>
          <p className="mt-2 text-slate-400">Today, calendar search, site/date filters, and adjustments</p>
        </div>
        <div className="flex gap-2">
          <Link href="/dashboard/attendance/adjustments">
            <Button variant="outline" className="border-slate-700 text-slate-300">
              <PencilLine className="mr-2 h-4 w-4" />
              Adjust
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
          <div className="grid gap-3 md:grid-cols-[1fr_180px_220px]">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-slate-500" />
              <Input
                placeholder="Search employee, ID, government ID, or site"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                className="border-slate-800 bg-slate-950/50 pl-10 text-slate-100"
              />
            </div>
            <Input
              type="date"
              value={date}
              onChange={(event) => setDate(event.target.value)}
              className="border-slate-800 bg-slate-950/50 text-slate-100"
            />
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
                    <th className="px-4 py-3 text-left font-semibold">Employee</th>
                    <th className="px-4 py-3 text-left font-semibold">Site</th>
                    <th className="px-4 py-3 text-left font-semibold">Check In</th>
                    <th className="px-4 py-3 text-left font-semibold">Check Out</th>
                    <th className="px-4 py-3 text-left font-semibold">Status</th>
                    <th className="px-4 py-3 text-left font-semibold">Face</th>
                    <th className="px-4 py-3 text-left font-semibold">GPS</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map(({ log, employee, site }) => (
                    <tr key={log.id} className="border-b border-slate-800 hover:bg-slate-800/50">
                      <td className="px-4 py-3">
                        <div>{employee?.name ?? "Unknown"}</div>
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
                      </td>
                      <td className="px-4 py-3 text-slate-400">
                        {log.confidenceScore ? `${(log.confidenceScore * 100).toFixed(1)}%` : "-"}
                      </td>
                      <td className="px-4 py-3 text-slate-400">
                        <div>
                          {site && log.gpsDistanceMeters != null
                            ? `${Math.round(log.gpsDistanceMeters)}m from site`
                            : "GPS captured"}
                        </div>
                        {log.gpsLatitude != null && log.gpsLongitude != null && (
                          <div className="mt-1 font-mono text-[10px] text-slate-500">
                            {log.gpsLatitude.toFixed(5)}, {log.gpsLongitude.toFixed(5)}
                          </div>
                        )}
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
