import { attendanceRepository } from "@/modules/attendance/repository/attendance.repository";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getSession } from "@/lib/auth";
import { toDateString } from "@/utils";
import {
  Users,
  MapPin,
  CheckCircle,
  Clock,
  ArrowRight,
  TrendingUp,
  AlertCircle,
  AlertTriangle,
  ScanFace,
  Copy,
  WifiOff
} from "lucide-react";

import { OperationsService } from "@/modules/operations/service/operations.service";

async function getDashboardData(orgId: string) {
  const today = toDateString();

  const [attendanceData, rawAnomalies] = await Promise.all([
    attendanceRepository.getDashboardData(orgId, today),
    OperationsService.getAnomalies(orgId)
  ]);

  const {
    employeeCount,
    todayAttendance,
    recentPunches,
  } = attendanceData;

  const checkedInToday = todayAttendance.length;
  const checkedOutToday = todayAttendance.filter((log) => log.checkOutTime).length;
  const lateToday = todayAttendance.filter((log) => log.status === "late").length;
  const absentToday = Math.max(0, employeeCount - checkedInToday);

  const anomalies = {
    missingCheckout: rawAnomalies.filter(a => a.type === "MISSING_CHECKOUT").length,
    outsideRadius: rawAnomalies.filter(a => a.type === "OUTSIDE_GEOFENCE").length,
    faceIssue: rawAnomalies.filter(a => a.type === "FACE_LOW_CONFIDENCE" || a.type === "FACE_NOT_REGISTERED").length,
    duplicatePunch: rawAnomalies.filter(a => a.type === "DUPLICATE_PUNCH").length,
    offlineSync: rawAnomalies.filter(a => a.type === "OFFLINE_SYNC").length,
  };

  const totalAnomalies = rawAnomalies.length;

  return {
    employeeCount,
    checkedInToday,
    checkedOutToday,
    lateToday,
    absentToday,
    recentPunches,
    anomalies,
    totalAnomalies,
  };
}

export default async function DashboardPage() {
  const session = await getSession();
  if (!session || !session.organizationId) {
    redirect("/login");
  }

  const data = await getDashboardData(session.organizationId);

  const stats = [
    {
      title: "Present Today",
      value: data.checkedInToday,
      description: `Active staff`,
      color: "from-emerald-500/10 to-emerald-600/5 text-emerald-400 border-emerald-500/20",
      icon: CheckCircle,
    },
    {
      title: "Late Arrivals",
      value: data.lateToday,
      description: "Past grace limits",
      color: "from-amber-500/10 to-amber-600/5 text-amber-400 border-amber-500/20",
      icon: Clock,
    },
    {
      title: "Missing Checkout",
      value: data.anomalies.missingCheckout,
      description: "Requires intervention",
      color: "from-rose-500/10 to-rose-600/5 text-rose-400 border-rose-500/20",
      icon: AlertTriangle,
    },
    {
      title: "Needs Review",
      value: data.totalAnomalies,
      description: "Total unresolved anomalies",
      color: "from-blue-500/10 to-blue-600/5 text-blue-400 border-blue-500/20",
      icon: AlertCircle,
    },
  ];

  const needsAttentionList = [
    { label: "Missing Checkout", count: data.anomalies.missingCheckout, icon: AlertTriangle, color: "text-rose-500", bg: "bg-rose-500/10" },
    { label: "Outside Radius", count: data.anomalies.outsideRadius, icon: MapPin, color: "text-amber-500", bg: "bg-amber-500/10" },
    { label: "Face Verification Issue", count: data.anomalies.faceIssue, icon: ScanFace, color: "text-orange-500", bg: "bg-orange-500/10" },
    { label: "Duplicate Punch", count: data.anomalies.duplicatePunch, icon: Copy, color: "text-blue-500", bg: "bg-blue-500/10" },
    { label: "Offline Sync Conflict", count: data.anomalies.offlineSync, icon: WifiOff, color: "text-purple-500", bg: "bg-purple-500/10" },
  ];

  return (
    <div className="max-w-3xl mx-auto mt-8 space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight">Good morning 👋</h1>
      </div>

      <div className="border border-zinc-800 rounded-2xl bg-[#0a0a0c] overflow-hidden shadow-sm">
        <div className="px-6 py-4 border-b border-zinc-800 bg-[#0e0e11]">
          <h2 className="font-bold text-zinc-100">Today</h2>
        </div>
        <div className="divide-y divide-zinc-800/60">
          <div className="flex justify-between px-6 py-4 hover:bg-zinc-900/30">
            <span className="font-medium text-zinc-300">Present</span>
            <span className="font-bold text-white">{data.checkedInToday}</span>
          </div>
          <div className="flex justify-between px-6 py-4 hover:bg-zinc-900/30">
            <span className="font-medium text-zinc-300">Late</span>
            <span className="font-bold text-white">{data.lateToday}</span>
          </div>
          <div className="flex justify-between px-6 py-4 hover:bg-zinc-900/30">
            <span className="font-medium text-zinc-300">Missing Out</span>
            <span className="font-bold text-white">{data.anomalies.missingCheckout}</span>
          </div>
          <div className="flex justify-between px-6 py-4 hover:bg-zinc-900/30">
            <span className="font-medium text-zinc-300">Needs Review</span>
            <span className="font-bold text-rose-400">{data.totalAnomalies}</span>
          </div>
        </div>

        {data.totalAnomalies > 0 && (
          <div className="p-6 flex justify-center bg-[#0e0e11] border-t border-zinc-800">
            <Link href="/dashboard/operations">
              <Button className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-8 h-10 shadow-sm">
                [ Review {data.totalAnomalies} Issues ]
              </Button>
            </Link>
          </div>
        )}
      </div>

      <div className="border border-zinc-800 rounded-2xl bg-[#0a0a0c] overflow-hidden shadow-sm">
        <div className="px-6 py-4 border-b border-zinc-800 bg-[#0e0e11]">
          <h2 className="font-bold text-zinc-100">Recent Attendance</h2>
        </div>
        <div className="p-6">
          {data.recentPunches.length === 0 ? (
            <p className="text-zinc-500 text-sm text-center py-4">No recent activity.</p>
          ) : (
            <div className="space-y-4">
              {data.recentPunches.slice(0, 5).map(punch => (
                <div key={punch.id} className="flex justify-between items-center text-sm">
                  <div>
                    <span className="font-semibold text-zinc-200">{punch.employeeName}</span>
                    <span className="text-zinc-500 ml-2">{punch.checkOutTime ? 'Checked out' : 'Checked in'}</span>
                  </div>
                  <span className="text-zinc-400">
                    {new Date(punch.checkOutTime || punch.checkInTime || '').toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
