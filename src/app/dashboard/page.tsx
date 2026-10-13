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
  CheckCircle2,
  Clock,
  ArrowRight,
  TrendingUp,
  AlertTriangle,
  ScanFace,
  Copy,
  WifiOff,
  Sparkles,
  UserPlus,
  Play,
  Calendar,
  Activity,
  ShieldCheck,
  Building2,
  ChevronRight,
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
  const attendanceRate = employeeCount > 0 ? Math.round((checkedInToday / employeeCount) * 100) : 0;

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
    attendanceRate,
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

  const todayFormatted = new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    month: "short",
    day: "numeric",
  }).format(new Date());

  const stats = [
    {
      title: "Present Today",
      value: data.checkedInToday,
      total: data.employeeCount,
      subtext: `${data.attendanceRate}% of workforce active`,
      icon: CheckCircle2,
      accentColor: "text-emerald-400",
      bgColor: "bg-emerald-500/10",
      borderColor: "border-emerald-500/20",
      gradient: "from-emerald-500/15 via-emerald-500/5 to-transparent",
    },
    {
      title: "Late Arrivals",
      value: data.lateToday,
      total: data.checkedInToday,
      subtext: data.lateToday > 0 ? `${data.lateToday} beyond grace period` : "All on schedule",
      icon: Clock,
      accentColor: "text-amber-400",
      bgColor: "bg-amber-500/10",
      borderColor: "border-amber-500/20",
      gradient: "from-amber-500/15 via-amber-500/5 to-transparent",
    },
    {
      title: "Missing Checkout",
      value: data.anomalies.missingCheckout,
      total: null,
      subtext: data.anomalies.missingCheckout > 0 ? "Pending shift sign-off" : "No open sessions",
      icon: AlertTriangle,
      accentColor: "text-rose-400",
      bgColor: "bg-rose-500/10",
      borderColor: "border-rose-500/20",
      gradient: "from-rose-500/15 via-rose-500/5 to-transparent",
    },
    {
      title: "Needs Review",
      value: data.totalAnomalies,
      total: null,
      subtext: data.totalAnomalies > 0 ? "Requires supervisor action" : "Work queue is clear",
      icon: Activity,
      accentColor: "text-blue-400",
      bgColor: "bg-blue-500/10",
      borderColor: "border-blue-500/20",
      gradient: "from-blue-500/15 via-blue-500/5 to-transparent",
    },
  ];

  const actionQueue = [
    {
      label: "Missing Checkout",
      count: data.anomalies.missingCheckout,
      desc: "Employees who haven't completed end-of-shift punches",
      icon: AlertTriangle,
      color: "text-rose-400",
      bg: "bg-rose-500/10",
      border: "border-rose-500/20",
    },
    {
      label: "Outside Geofence",
      count: data.anomalies.outsideRadius,
      desc: "Punches captured outside designated site boundaries",
      icon: MapPin,
      color: "text-amber-400",
      bg: "bg-amber-500/10",
      border: "border-amber-500/20",
    },
    {
      label: "Face Verification Flag",
      count: data.anomalies.faceIssue,
      desc: "Low-confidence biometric detections or fallback logs",
      icon: ScanFace,
      color: "text-blue-400",
      bg: "bg-blue-500/10",
      border: "border-blue-500/20",
    },
    {
      label: "Duplicate Punches",
      count: data.anomalies.duplicatePunch,
      desc: "Rapid sequential logs captured within cooldown window",
      icon: Copy,
      color: "text-purple-400",
      bg: "bg-purple-500/10",
      border: "border-purple-500/20",
    },
  ];

  return (
    <div className="space-y-8 pb-10">
      {/* ─── Hero Header & Action Bar ─── */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-gradient-to-r from-zinc-900/80 via-zinc-900/40 to-transparent p-6 rounded-3xl border border-zinc-800/80 backdrop-blur-sm">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-zinc-400 uppercase tracking-widest">
            <span>{todayFormatted}</span>
            <span>•</span>
            <span className="text-emerald-400 flex items-center gap-1">
              <span className="size-1.5 rounded-full bg-emerald-400 animate-pulse"></span> Live Workspace
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight mt-1">
            Good morning 👋
          </h1>
          <p className="text-sm text-zinc-400 mt-1">
            Here is your daily attendance summary and operational action items.
          </p>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <Link href="/attendance" target="_blank">
            <Button variant="outline" className="h-10 px-4 rounded-xl border-zinc-700 bg-zinc-800/60 hover:bg-zinc-800 text-zinc-200 text-xs font-semibold flex items-center gap-2">
              <Play className="size-3.5 text-blue-400" />
              Open Kiosk
            </Button>
          </Link>

          <Link href="/dashboard/employees/new">
            <Button variant="outline" className="h-10 px-4 rounded-xl border-zinc-700 bg-zinc-800/60 hover:bg-zinc-800 text-zinc-200 text-xs font-semibold flex items-center gap-2">
              <UserPlus className="size-3.5 text-zinc-400" />
              Add Employee
            </Button>
          </Link>

          {data.totalAnomalies > 0 ? (
            <Link href="/dashboard/operations">
              <Button className="h-10 px-5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-lg shadow-blue-600/20 flex items-center gap-2">
                <Activity className="size-3.5" />
                Resolve {data.totalAnomalies} Issues
              </Button>
            </Link>
          ) : (
            <Link href="/dashboard/attendance">
              <Button className="h-10 px-5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white font-semibold text-xs border border-zinc-700 flex items-center gap-2">
                View All Logs
                <ArrowRight className="size-3.5" />
              </Button>
            </Link>
          )}
        </div>
      </div>

      {/* ─── 4-Card Hero Metric Grid ─── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, i) => {
          const Icon = stat.icon;
          return (
            <div
              key={i}
              className={`relative overflow-hidden rounded-2xl border ${stat.borderColor} bg-gradient-to-b ${stat.gradient} bg-zinc-950/70 p-5 backdrop-blur-sm transition-all duration-200 hover:border-zinc-700 group`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                  {stat.title}
                </span>
                <div className={`size-8 rounded-xl ${stat.bgColor} flex items-center justify-center ${stat.accentColor} border ${stat.borderColor}`}>
                  <Icon className="size-4" />
                </div>
              </div>

              <div className="mt-4 flex items-baseline gap-2">
                <span className="text-3xl font-black tracking-tight text-white">
                  {stat.value}
                </span>
                {stat.total !== null && (
                  <span className="text-xs text-zinc-500 font-medium">
                    / {stat.total} total
                  </span>
                )}
              </div>

              <p className="mt-2 text-xs font-medium text-zinc-400">
                {stat.subtext}
              </p>
            </div>
          );
        })}
      </div>

      {/* ─── Main Two-Column Layout ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Operations Work Queue (7 Cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="size-7 rounded-lg bg-blue-600/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
                <Activity className="size-4" />
              </div>
              <h2 className="text-base font-bold text-white tracking-tight">Operations Action Queue</h2>
            </div>
            <Link
              href="/dashboard/operations"
              className="text-xs font-semibold text-blue-400 hover:text-blue-300 flex items-center gap-1 transition-colors"
            >
              Open Operations Hub <ChevronRight className="size-3.5" />
            </Link>
          </div>

          <div className="rounded-2xl border border-zinc-800 bg-[#0c0c0e] divide-y divide-zinc-800/70 overflow-hidden shadow-sm">
            {actionQueue.map((item, idx) => {
              const Icon = item.icon;
              return (
                <Link
                  key={idx}
                  href="/dashboard/operations"
                  className="flex items-center justify-between p-4.5 hover:bg-zinc-900/60 transition-colors group cursor-pointer"
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div className={`size-9 rounded-xl ${item.bg} ${item.border} border flex items-center justify-center ${item.color} shrink-0`}>
                      <Icon className="size-4.5" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-zinc-200 group-hover:text-white transition-colors truncate">
                        {item.label}
                      </p>
                      <p className="text-xs text-zinc-500 truncate mt-0.5">
                        {item.desc}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0 ml-3">
                    <span className={`text-xs font-bold px-2.5 py-1 rounded-full border ${
                      item.count > 0 
                        ? `${item.bg} ${item.color} ${item.border}` 
                        : "bg-zinc-900 text-zinc-600 border-zinc-800"
                    }`}>
                      {item.count} {item.count === 1 ? "issue" : "issues"}
                    </span>
                    <ChevronRight className="size-4 text-zinc-600 group-hover:text-zinc-400 group-hover:translate-x-0.5 transition-all" />
                  </div>
                </Link>
              );
            })}
          </div>

          {/* Quick Info Box */}
          <div className="p-4 rounded-2xl bg-zinc-900/30 border border-zinc-800/80 flex items-start gap-3">
            <ShieldCheck className="size-4.5 text-blue-400 mt-0.5 shrink-0" />
            <div className="text-xs text-zinc-400 leading-relaxed">
              <span className="font-semibold text-zinc-300">Automated Audit Trail:</span> All supervisor resolutions made in the Operations Hub are stamped with compliance notes and directly sync with Leave Balances and Payroll calculation runs.
            </div>
          </div>
        </div>

        {/* Right Column: Live Punch Activity Stream (5 Cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="size-7 rounded-lg bg-emerald-600/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                <Clock className="size-4" />
              </div>
              <h2 className="text-base font-bold text-white tracking-tight">Recent Punches</h2>
            </div>
            <Link
              href="/dashboard/attendance"
              className="text-xs font-semibold text-zinc-400 hover:text-white flex items-center gap-1 transition-colors"
            >
              View Full Log <ChevronRight className="size-3.5" />
            </Link>
          </div>

          <div className="rounded-2xl border border-zinc-800 bg-[#0c0c0e] p-4 shadow-sm min-h-[360px]">
            {data.recentPunches.length === 0 ? (
              <div className="h-64 flex flex-col items-center justify-center text-center p-6">
                <div className="size-12 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-600 mb-3">
                  <Clock className="size-6" />
                </div>
                <p className="text-sm font-semibold text-zinc-300">No punch records today</p>
                <p className="text-xs text-zinc-500 mt-1 max-w-[200px]">
                  Employees will appear here as they clock in via the kiosk.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {data.recentPunches.slice(0, 6).map((punch) => {
                  const isCheckOut = !!punch.checkOutTime;
                  const time = new Date(punch.checkOutTime || punch.checkInTime || "");
                  const formattedTime = time.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

                  return (
                    <div
                      key={punch.id}
                      className="flex items-center justify-between p-3 rounded-xl bg-zinc-900/40 border border-zinc-800/60 hover:bg-zinc-900/80 transition-colors"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="size-8 rounded-full bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-white text-xs font-bold shrink-0">
                          {punch.employeeName?.charAt(0).toUpperCase() || "E"}
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-white truncate">
                            {punch.employeeName}
                          </p>
                          <p className="text-[10px] text-zinc-500 font-mono truncate">
                            {punch.employeeCode}
                          </p>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <div className="flex items-center gap-1.5 justify-end">
                          <span className={`size-1.5 rounded-full ${isCheckOut ? "bg-zinc-500" : "bg-emerald-400"}`} />
                          <span className={`text-[11px] font-bold ${isCheckOut ? "text-zinc-400" : "text-emerald-400"}`}>
                            {isCheckOut ? "OUT" : "IN"}
                          </span>
                          {punch.status === "late" && (
                            <span className="text-[9px] font-extrabold px-1.5 py-0.2 rounded bg-amber-500/10 border border-amber-500/20 text-amber-400 uppercase">
                              LATE
                            </span>
                          )}
                        </div>
                        <p className="text-[10px] text-zinc-500 font-medium mt-0.5">
                          {formattedTime}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
