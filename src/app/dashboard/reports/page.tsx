"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CalendarDays, Download, Coins, CalendarOff } from "lucide-react";
import { toast } from "sonner";

interface Site {
  id: string;
  name: string;
}

interface Employee {
  id: string;
  name: string;
  employeeCode: string;
}

function ReportCard({
  title,
  domain,
  desc,
  icon: Icon,
  sites,
  employees
}: {
  title: string;
  domain: string;
  desc: string;
  icon: any;
  sites: Site[];
  employees: Employee[];
}) {
  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    d.setDate(1);
    return d.toISOString().split("T")[0];
  });
  const [endDate, setEndDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [siteId, setSiteId] = useState("all");
  const [employeeId, setEmployeeId] = useState("all");

  function getExportUrl() {
    const params = new URLSearchParams({ domain });
    params.set("startDate", startDate);
    params.set("endDate", endDate);
    if (siteId !== "all") params.set("siteId", siteId);
    if (employeeId !== "all") params.set("employeeId", employeeId);
    return `/api/reports/export?${params.toString()}`;
  }

  return (
    <Card className="border-slate-800 bg-slate-900 flex flex-col">
      <CardHeader>
        <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-md bg-blue-600/20 text-blue-400">
          <Icon className="h-5 w-5" />
        </div>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{desc}</CardDescription>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col gap-4">
        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-1">
            <Label className="text-xs text-slate-400">Start Date</Label>
            <Input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="h-8 border-slate-800 bg-slate-950/50 text-slate-100 text-sm"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-slate-400">End Date</Label>
            <Input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="h-8 border-slate-800 bg-slate-950/50 text-slate-100 text-sm"
            />
          </div>
        </div>

        <div className="space-y-1">
          <Label className="text-xs text-slate-400">Site (Optional)</Label>
          <Select value={siteId} onValueChange={(v) => setSiteId(v as string)}>
            <SelectTrigger className="h-8 border-slate-800 bg-slate-950/50 text-slate-100 text-sm">
              <SelectValue placeholder="All Sites" />
            </SelectTrigger>
            <SelectContent className="border-slate-800 bg-slate-900">
              <SelectItem value="all">All Sites</SelectItem>
              {sites.map((site) => (
                <SelectItem key={site.id} value={site.id}>{site.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1">
          <Label className="text-xs text-slate-400">Employee (Optional)</Label>
          <Select value={employeeId} onValueChange={(v) => setEmployeeId(v as string)}>
            <SelectTrigger className="h-8 border-slate-800 bg-slate-950/50 text-slate-100 text-sm">
              <SelectValue placeholder="All Employees" />
            </SelectTrigger>
            <SelectContent className="border-slate-800 bg-slate-900 max-h-48">
              <SelectItem value="all">All Employees</SelectItem>
              {employees.map((emp) => (
                <SelectItem key={emp.id} value={emp.id}>{emp.name} ({emp.employeeCode})</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="mt-auto pt-4">
          <Link href={getExportUrl()} target="_blank" rel="noopener noreferrer">
            <Button type="button" className="w-full bg-blue-600 hover:bg-blue-700">
              <Download className="mr-2 h-4 w-4" />
              Export CSV
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}

export default function ReportsPage() {
  const [sites, setSites] = useState<Site[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);

  useEffect(() => {
    async function fetchData() {
      try {
        const [sitesRes, empRes] = await Promise.all([
          fetch("/api/sites"),
          fetch("/api/employees")
        ]);

        if (sitesRes.ok) {
          const s = await sitesRes.json();
          setSites(s.data || []);
        }
        if (empRes.ok) {
          const e = await empRes.json();
          setEmployees(e.data || []);
        }
      } catch {
        toast.error("Failed to load filters");
      }
    }
    fetchData();
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Reports</h1>
        <p className="mt-2 text-slate-400">Simple CSV exports for Attendance, Leave, and Payroll.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <ReportCard
          title="Attendance Export"
          domain="attendance"
          desc="Daily attendance logs, check in/out times"
          icon={CalendarDays}
          sites={sites}
          employees={employees}
        />
        <ReportCard
          title="Leave Export"
          domain="leave"
          desc="Leave requests, dates, and status"
          icon={CalendarOff}
          sites={sites}
          employees={employees}
        />
        <ReportCard
          title="Payroll Detail"
          domain="payroll"
          desc="Calculated salary, days present, deductions"
          icon={Coins}
          sites={sites}
          employees={employees}
        />
        <ReportCard
          title="Payslip Register"
          domain="payslip"
          desc="Index of all issued payslips and net pay"
          icon={Coins}
          sites={sites}
          employees={employees}
        />
      </div>
    </div>
  );
}
