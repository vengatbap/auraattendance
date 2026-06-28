"use client";

import { useEffect, useState } from "react";
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
import { Loader, Save } from "lucide-react";
import { toast } from "sonner";

interface AttendanceRow {
  log: {
    id: string;
    date: string;
    checkInTime: string | null;
    checkOutTime: string | null;
    status: string;
  };
  employee: {
    name: string;
    employeeCode: string;
  } | null;
  site: {
    name: string;
  } | null;
}

export default function AttendanceAdjustmentsPage() {
  const [rows, setRows] = useState<AttendanceRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [attendanceLogId, setAttendanceLogId] = useState("");
  const [type, setType] = useState("check_in_time");
  const [checkInTime, setCheckInTime] = useState("");
  const [checkOutTime, setCheckOutTime] = useState("");
  const [reason, setReason] = useState("");
  const [saving, setSaving] = useState(false);

  async function fetchRows() {
    try {
      const today = new Date().toISOString().split("T")[0];
      const res = await fetch(`/api/attendance?limit=100&date=${today}`);
      if (!res.ok) throw new Error("Failed");
      setRows(await res.json());
    } catch {
      toast.error("Failed to load attendance records");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchRows();
  }, []);

  async function submit() {
    if (!attendanceLogId || !reason.trim()) {
      toast.error("Attendance record and reason are required");
      return;
    }

    setSaving(true);
    try {
      const body: Record<string, string> = {
        attendanceLogId,
        type,
        reason,
      };

      if (checkInTime) body.checkInTime = new Date(checkInTime).toISOString();
      if (checkOutTime) body.checkOutTime = new Date(checkOutTime).toISOString();
      if (type === "missed_punch" && checkInTime) body.date = checkInTime.split("T")[0];

      const res = await fetch("/api/attendance/adjust", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save adjustment");

      toast.success("Adjustment saved");
      setReason("");
      setCheckInTime("");
      setCheckOutTime("");
      await fetchRows();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to save adjustment");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Attendance Adjustment</h1>
        <p className="mt-2 text-slate-400">Edit IN, edit OUT, mark present/absent, and audit every change</p>
      </div>

      <Card className="max-w-3xl border-slate-800 bg-slate-900">
        <CardHeader>
          <CardTitle>Adjust Record</CardTitle>
          <CardDescription>All adjustments are written to audit logs.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader className="h-6 w-6 animate-spin text-blue-600" />
            </div>
          ) : (
            <>
              <Select value={attendanceLogId} onValueChange={(value) => setAttendanceLogId(value ?? "")}>
                <SelectTrigger className="border-slate-800 bg-slate-950/50 text-slate-100">
                  <SelectValue placeholder="Select attendance record" />
                </SelectTrigger>
                <SelectContent className="border-slate-800 bg-slate-900">
                  {rows.map(({ log, employee, site }) => (
                    <SelectItem key={log.id} value={log.id} className="text-slate-100">
                      {(employee?.name ?? "Unknown")} - {(site?.name ?? "No site")} - {log.status}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={type} onValueChange={(value) => setType(value ?? "check_in_time")}>
                <SelectTrigger className="border-slate-800 bg-slate-950/50 text-slate-100">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="border-slate-800 bg-slate-900">
                  <SelectItem value="check_in_time" className="text-slate-100">Edit IN</SelectItem>
                  <SelectItem value="check_out_time" className="text-slate-100">Edit OUT</SelectItem>
                  <SelectItem value="mark_present" className="text-slate-100">Mark Present</SelectItem>
                  <SelectItem value="mark_absent" className="text-slate-100">Mark Absent</SelectItem>
                  <SelectItem value="missed_punch" className="text-slate-100">Add Missing Punch</SelectItem>
                </SelectContent>
              </Select>

              {(type === "check_in_time" || type === "missed_punch") && (
                <Input
                  type="datetime-local"
                  value={checkInTime}
                  onChange={(event) => setCheckInTime(event.target.value)}
                  className="border-slate-800 bg-slate-950/50 text-slate-100"
                />
              )}

              {(type === "check_out_time" || type === "missed_punch") && (
                <Input
                  type="datetime-local"
                  value={checkOutTime}
                  onChange={(event) => setCheckOutTime(event.target.value)}
                  className="border-slate-800 bg-slate-950/50 text-slate-100"
                />
              )}

              <Input
                value={reason}
                onChange={(event) => setReason(event.target.value)}
                placeholder="Reason for adjustment"
                className="border-slate-800 bg-slate-950/50 text-slate-100"
              />

              <Button onClick={submit} disabled={saving} className="bg-blue-600 hover:bg-blue-700">
                {saving ? <Loader className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                Save Adjustment
              </Button>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
