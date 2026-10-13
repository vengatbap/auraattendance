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
    <div className="space-y-8">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-white">Morning Overview</h1>
          <p className="text-zinc-500 mt-1 text-sm">Review today's attendance and resolve anomalies.</p>
        </div>
        <Link href="/dashboard/operations">
          <Button className="bg-amber-600 hover:bg-amber-700 text-white font-bold px-5 py-2.5 rounded-xl h-10 text-xs shadow-sm cursor-pointer transition-colors duration-150">
            Open Operations Hub
            <ArrowRight className="size-3.5 ml-1.5" />
          </Button>
        </Link>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => (
          <Card key={stat.title} className="bg-[#0e0e11] border-zinc-900 rounded-2xl shadow-sm overflow-hidden relative group hover:border-zinc-800 transition-all duration-300">
            <div className="absolute inset-0 bg-gradient-to-br from-white/1 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <CardHeader className="pb-3 flex flex-row items-center justify-between">
              <CardTitle className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">{stat.title}</CardTitle>
              <div className={`p-2 rounded-xl border ${stat.color}`}>
                <stat.icon className="size-4" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-black text-white">{stat.value}</div>
              <p className="text-zinc-500 text-[11px] mt-1.5 font-medium">{stat.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1.2fr_0.8fr] gap-6">
        {/* Left: Needs Attention */}
        <div className="space-y-6">
          <Card className="bg-[#0e0e11] border-rose-900/40 rounded-2xl shadow-sm overflow-hidden relative">
            <CardHeader className="pb-4 border-b border-zinc-900/60">
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle className="text-base font-bold flex items-center gap-2 text-rose-500">
                    <AlertTriangle className="size-5" />
                    Needs Attention
                  </CardTitle>
                  <CardDescription className="text-xs text-zinc-500 mt-1">Anomalies requiring administrator resolution.</CardDescription>
                </div>
                {data.totalAnomalies > 0 && (
                  <span className="text-[10px] font-bold bg-rose-500/10 border border-rose-500/20 text-rose-400 px-3 py-1 rounded-full animate-pulse">
                    {data.totalAnomalies} unresolved
                  </span>
                )}
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-zinc-900/60">
                {needsAttentionList.map((item, idx) => (
                  <Link href={`/dashboard/operations?filter=${item.label.toLowerCase().replace(/ /g, '-')}`} key={idx} className="flex items-center justify-between p-4 hover:bg-zinc-900/50 transition-colors group cursor-pointer">
                    <div className="flex items-center gap-4">
                      <div className={`p-2 rounded-lg ${item.bg} ${item.color}`}>
                        <item.icon className="size-4" />
                      </div>
                      <span className="text-sm font-semibold text-zinc-200">{item.label}</span>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className={`text-sm font-black ${item.count > 0 ? "text-white" : "text-zinc-600"}`}>
                        {item.count}
                      </span>
                      <ArrowRight className={`size-4 transition-transform group-hover:translate-x-1 ${item.count > 0 ? "text-zinc-400" : "text-zinc-700"}`} />
                    </div>
                  </Link>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right: Live activity log */}
        <div className="space-y-6">
          <Card className="bg-[#0e0e11] border-zinc-900 rounded-2xl shadow-sm">
            <CardHeader>
              <CardTitle className="text-sm font-bold flex items-center gap-2 text-white">
                <Clock className="size-4.5 text-zinc-400" />
                Recent Punches
              </CardTitle>
              <CardDescription className="text-xs text-zinc-500">Latest active logs captured at Kiosk.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 py-4 border-t border-zinc-900/60 mt-2 h-[400px] overflow-y-auto">
              {data.recentPunches.length === 0 ? (
                <p className="text-zinc-650 text-xs py-4 text-center">No punch activity recorded today.</p>
              ) : (
                <div className="flow-root">
                  <ul className="-mb-8">
                    {data.recentPunches.map((punch, idx) => (
                      <li key={punch.id}>
                        <div className="relative pb-8">
                          {idx !== data.recentPunches.length - 1 ? (
                            <span className="absolute left-4 top-4 -ml-px h-full w-0.5 bg-zinc-950" aria-hidden="true" />
                          ) : null}
                          <div className="relative flex space-x-3">
                            <div>
                              <span className={`h-8 w-8 rounded-xl flex items-center justify-center border ${
                                punch.checkOutTime
                                  ? "bg-zinc-950 border-zinc-900 text-zinc-400"
                                  : "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
                              }`}>
                                <CheckCircle className="size-3.5" />
                              </span>
                            </div>
                            <div className="flex-1 min-w-0 pt-1.5 flex justify-between space-x-4">
                              <div>
                                <p className="text-xs font-bold text-zinc-200">
                                  {punch.employeeName}{" "}
                                  <span className="text-[10px] text-zinc-555 font-normal font-mono">({punch.employeeCode})</span>
                                </p>
                                <p className="text-[10px] text-zinc-500 mt-0.5">
                                  {punch.checkOutTime ? "Checked out" : "Checked in"}{" "}
                                  {punch.status === "late" && (
                                    <span className="text-amber-500 font-black uppercase text-[8px] tracking-wider ml-1">LATE</span>
                                  )}
                                </p>
                              </div>
                              <div className="text-right text-[10px] whitespace-nowrap text-zinc-500">
                                <time dateTime={new Date(punch.checkOutTime || punch.checkInTime || "").toISOString()}>
                                  {new Date(punch.checkOutTime || punch.checkInTime || "").toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                                </time>
                              </div>
                            </div>
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
