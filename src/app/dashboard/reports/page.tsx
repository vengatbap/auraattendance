"use client";

import { useEffect, useState } from "react";
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
import { CalendarDays, Download, FileSpreadsheet, MapPin, UserRound } from "lucide-react";
import { toast } from "sonner";

interface Site {
  id: string;
  name: string;
  status: string;
}

export default function ReportsPage() {
  const [sites, setSites] = useState<Site[]>([]);
  const [date, setDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [month, setMonth] = useState(() => new Date().toISOString().slice(0, 7));
  const [siteId, setSiteId] = useState("all");

  useEffect(() => {
    async function fetchSites() {
      try {
        const res = await fetch("/api/sites");
        if (!res.ok) throw new Error("Failed");
        setSites(await res.json());
      } catch {
        toast.error("Failed to load sites");
      }
    }

    fetchSites();
  }, []);

  function href(type: string, format: "csv" | "excel") {
    const params = new URLSearchParams({ type, format });
    if (type === "daily" || type === "site") params.set("date", date);
    if (type === "monthly") params.set("month", month);
    if (siteId !== "all") params.set("siteId", siteId);
    return `/api/reports/export?${params.toString()}`;
  }

  const reports = [
    {
      type: "daily",
      title: "Daily Attendance",
      desc: "Employee, check in, check out, hours, site",
      icon: CalendarDays,
    },
    {
      type: "monthly",
      title: "Monthly Attendance",
      desc: "Present, absent, late, working hours",
      icon: FileSpreadsheet,
    },
    {
      type: "site",
      title: "Site Attendance",
      desc: "Today attendance, employees, hours by site",
      icon: MapPin,
    },
    {
      type: "employee",
      title: "Employee Attendance",
      desc: "Employee-level attendance export",
      icon: UserRound,
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Reports</h1>
        <p className="mt-2 text-slate-400">Daily, monthly, site, employee, CSV and Excel exports</p>
      </div>

      <Card className="border-slate-800 bg-slate-900">
        <CardHeader>
          <CardTitle>Filters</CardTitle>
          <CardDescription>Choose report period and site.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-3">
          <Input
            type="date"
            value={date}
            onChange={(event) => setDate(event.target.value)}
            className="border-slate-800 bg-slate-950/50 text-slate-100"
          />
          <Input
            type="month"
            value={month}
            onChange={(event) => setMonth(event.target.value)}
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
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
        {reports.map((report) => {
          const Icon = report.icon;
          return (
            <Card key={report.type} className="border-slate-800 bg-slate-900">
              <CardHeader>
                <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-md bg-blue-600/20 text-blue-400">
                  <Icon className="h-5 w-5" />
                </div>
                <CardTitle>{report.title}</CardTitle>
                <CardDescription>{report.desc}</CardDescription>
              </CardHeader>
              <CardContent className="flex gap-2">
                <Link href={href(report.type, "csv")}>
                  <Button variant="outline" size="sm" className="border-slate-700 text-slate-300">
                    <Download className="mr-2 h-4 w-4" />
                    CSV
                  </Button>
                </Link>
                <Link href={href(report.type, "excel")}>
                  <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
                    <Download className="mr-2 h-4 w-4" />
                    Excel
                  </Button>
                </Link>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
