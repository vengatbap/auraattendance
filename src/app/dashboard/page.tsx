import { db } from "@/db";
import { users, sites, employees, attendanceLogs, faceProfiles, organizations } from "@/db/schema";
import { and, eq, isNull, sql, desc } from "drizzle-orm";
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
  Sparkles,
  ArrowRight,
  TrendingUp,
  AlertCircle,
} from "lucide-react";

async function getDashboardData(orgId: string) {
  const today = toDateString();

  const [
    adminCount,
    siteCount,
    employeeCount,
    todayAttendance,
    recentPunches,
    faceCount,
    orgDetails,
  ] = await Promise.all([
    db
      .select({ count: sql<number>`count(*)` })
      .from(users)
      .where(eq(users.organizationId, orgId))
      .then((res) => Number(res[0].count)),
    db
      .select({ count: sql<number>`count(*)` })
      .from(sites)
      .where(and(eq(sites.organizationId, orgId), isNull(sites.deletedAt)))
      .then((res) => Number(res[0].count)),
    db
      .select({ count: sql<number>`count(*)` })
      .from(employees)
      .where(and(eq(employees.organizationId, orgId), isNull(employees.deletedAt)))
      .then((res) => Number(res[0].count)),
    db
      .select()
      .from(attendanceLogs)
      .where(and(eq(attendanceLogs.organizationId, orgId), eq(attendanceLogs.date, today))),
    db
      .select({
        id: attendanceLogs.id,
        employeeName: employees.name,
        employeeCode: employees.employeeCode,
        checkInTime: attendanceLogs.checkInTime,
        checkOutTime: attendanceLogs.checkOutTime,
        status: attendanceLogs.status,
      })
      .from(attendanceLogs)
      .innerJoin(employees, eq(attendanceLogs.employeeId, employees.id))
      .where(eq(attendanceLogs.organizationId, orgId))
      .orderBy(desc(attendanceLogs.createdAt))
      .limit(5),
    db
      .select({ count: sql<number>`count(*)` })
      .from(faceProfiles)
      .where(eq(faceProfiles.organizationId, orgId))
      .then((res) => Number(res[0].count)),
    db
      .select()
      .from(organizations)
      .where(eq(organizations.id, orgId))
      .limit(1)
      .then((res) => res[0]),
  ]);

  const checkedInToday = todayAttendance.filter((log) => log.checkInTime).length;
  const checkedOutToday = todayAttendance.filter((log) => log.checkOutTime).length;
  const lateToday = todayAttendance.filter((log) => log.status === "late").length;
  const absentToday = Math.max(0, employeeCount - checkedInToday);

  // Setup wizard checklist states
  const hasBranding = Boolean(orgDetails?.logo || orgDetails?.primaryColor !== "#2563eb");
  const hasSite = siteCount > 0;
  const hasEmployee = employeeCount > 0;
  const hasFace = faceCount > 0;
  const hasPunch = todayAttendance.length > 0;

  return {
    adminCount,
    siteCount,
    employeeCount,
    checkedInToday,
    checkedOutToday,
    lateToday,
    absentToday,
    recentPunches,
    checklist: {
      hasBranding,
      hasSite,
      hasEmployee,
      hasFace,
      hasPunch,
    },
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
      title: "Total Staff",
      value: data.employeeCount,
      description: "Active enrolled employees",
      color: "from-blue-600 to-indigo-600",
      icon: Users,
    },
    {
      title: "Active Sites",
      value: data.siteCount,
      description: "GPS-geofenced workplaces",
      color: "from-purple-600 to-pink-600",
      icon: MapPin,
    },
    {
      title: "Present Today",
      value: data.checkedInToday,
      description: `Checked out: ${data.checkedOutToday}`,
      color: "from-emerald-600 to-teal-600",
      icon: CheckCircle,
    },
    {
      title: "Late Punches",
      value: data.lateToday,
      description: "Past grace limits",
      color: "from-amber-600 to-orange-600",
      icon: Clock,
    },
  ];

  // Checklist counts
  const checklistItems = [
    { label: "Define Custom Branding Colors & Logo", done: data.checklist.hasBranding, href: "/dashboard/settings" },
    { label: "Create Your First Approved Location Site", done: data.checklist.hasSite, href: "/dashboard/sites" },
    { label: "Enroll An Employee Profile", done: data.checklist.hasEmployee, href: "/dashboard/employees" },
    { label: "Register Face Biometric Pattern", done: data.checklist.hasFace, href: "/dashboard/employees" },
    { label: "Record First Verification Punch Log", done: data.checklist.hasPunch, href: "/attendance" },
  ];
  const doneCount = checklistItems.filter((i) => i.done).length;

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-slate-400 mt-2">Continuous biometrics and GPS geofence tracking analytics</p>
        </div>
        <Link href="/attendance" target="_blank">
          <Button className="bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-600/20 font-bold px-5 py-2 rounded-2xl h-11 text-xs">
            Open Attendance Kiosk
            <ArrowRight className="size-4 ml-2" />
          </Button>
        </Link>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => (
          <Card key={stat.title} className="bg-slate-950/40 border-slate-900 rounded-3xl shadow-xl overflow-hidden relative group hover:border-slate-800 transition-all duration-300">
            <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <CardHeader className="pb-3 flex flex-row items-center justify-between">
              <CardTitle className="text-xs font-semibold text-slate-500 uppercase tracking-widest">{stat.title}</CardTitle>
              <div className={`p-2 rounded-xl bg-gradient-to-br ${stat.color} text-white shadow-md`}>
                <stat.icon className="size-4" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-extrabold text-white">{stat.value}</div>
              <p className="text-slate-500 text-[11px] mt-1.5 font-medium">{stat.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1.2fr_0.8fr] gap-6">
        {/* Left: Setup Checklist + SVG Graph */}
        <div className="space-y-6">
          {/* Setup Checklist */}
          {doneCount < 5 && (
            <Card className="bg-slate-950/40 border-slate-900 rounded-3xl shadow-xl overflow-hidden relative">
              <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
                <Sparkles className="size-40 text-blue-500" />
              </div>
              <CardHeader className="pb-4">
                <div className="flex justify-between items-center flex-wrap gap-2">
                  <div>
                    <CardTitle className="text-base font-bold flex items-center gap-2">
                      <Sparkles className="size-4.5 text-blue-500" />
                      Get Aura Launch Ready
                    </CardTitle>
                    <CardDescription className="text-xs text-slate-500 mt-1">Complete these steps to activate full kiosk verification.</CardDescription>
                  </div>
                  <span className="text-xs font-extrabold bg-blue-500/10 border border-blue-500/20 text-blue-400 px-3 py-1 rounded-full">
                    {doneCount} / 5 Steps Done
                  </span>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {checklistItems.map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 rounded-2xl bg-slate-950/60 border border-slate-900/60 hover:bg-slate-950 transition-colors">
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={item.done}
                        readOnly
                        className="rounded-md border-slate-800 bg-slate-950 text-blue-600 focus:ring-blue-600 focus:ring-offset-slate-950 size-4"
                      />
                      <span className={`text-xs font-semibold ${item.done ? "text-slate-500 line-through" : "text-slate-300"}`}>
                        {item.label}
                      </span>
                    </div>
                    {!item.done && (
                      <Link href={item.href}>
                        <Button variant="ghost" size="sm" className="text-blue-500 hover:bg-blue-500/10 text-xs px-3 py-1 rounded-xl h-8">
                          Configure
                          <ArrowRight className="size-3.5 ml-1.5" />
                        </Button>
                      </Link>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* SVG Graphs / Present Statistics */}
          <Card className="bg-slate-950/40 border-slate-900 rounded-3xl shadow-xl">
            <CardHeader>
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <TrendingUp className="size-4.5 text-emerald-500" />
                Attendance Allocation
              </CardTitle>
              <CardDescription className="text-xs text-slate-500">Real-time present vs absent ratio for active staff.</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col sm:flex-row items-center justify-around gap-6 py-6">
              {/* SVG Donut Chart */}
              <div className="relative size-32 shrink-0">
                <svg className="size-full -rotate-90" viewBox="0 0 36 36">
                  {/* Background Circle */}
                  <path
                    className="text-slate-900"
                    strokeWidth="3.5"
                    stroke="currentColor"
                    fill="none"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                  {/* Present Arc */}
                  {data.employeeCount > 0 && (
                    <path
                      className="text-emerald-500"
                      strokeDasharray={`${(data.checkedInToday / data.employeeCount) * 100}, 100`}
                      strokeWidth="3.5"
                      strokeLinecap="round"
                      stroke="currentColor"
                      fill="none"
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    />
                  )}
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-2xl font-black text-white">
                    {data.employeeCount > 0 ? Math.round((data.checkedInToday / data.employeeCount) * 100) : 0}%
                  </span>
                  <span className="text-[9px] font-extrabold text-slate-500 uppercase tracking-widest">Rate</span>
                </div>
              </div>

              {/* Legend and details */}
              <div className="w-full max-w-xs space-y-4">
                <div className="flex justify-between items-center text-xs">
                  <div className="flex items-center gap-2">
                    <span className="size-2.5 rounded-full bg-emerald-500" />
                    <span className="font-semibold text-slate-300">Checked In</span>
                  </div>
                  <span className="font-extrabold text-white">{data.checkedInToday} staff</span>
                </div>

                <div className="flex justify-between items-center text-xs">
                  <div className="flex items-center gap-2">
                    <span className="size-2.5 rounded-full bg-amber-500" />
                    <span className="font-semibold text-slate-300">Late Arrivals</span>
                  </div>
                  <span className="font-extrabold text-white">{data.lateToday} staff</span>
                </div>

                <div className="flex justify-between items-center text-xs">
                  <div className="flex items-center gap-2">
                    <span className="size-2.5 rounded-full bg-slate-800" />
                    <span className="font-semibold text-slate-300">Absent / Pending</span>
                  </div>
                  <span className="font-extrabold text-white">{data.absentToday} staff</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right: Recent activity log + Quick navigation */}
        <div className="space-y-6">
          {/* Recent Activity Log */}
          <Card className="bg-slate-950/40 border-slate-900 rounded-3xl shadow-xl">
            <CardHeader>
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <AlertCircle className="size-4.5 text-blue-500" />
                Live Punch Activity
              </CardTitle>
              <CardDescription className="text-xs text-slate-500">Latest active logs captured at Kiosk.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {data.recentPunches.length === 0 ? (
                <p className="text-slate-500 text-xs py-4 text-center">No punch activity recorded today.</p>
              ) : (
                <div className="flow-root">
                  <ul className="-mb-8">
                    {data.recentPunches.map((punch, idx) => (
                      <li key={punch.id}>
                        <div className="relative pb-8">
                          {idx !== data.recentPunches.length - 1 ? (
                            <span className="absolute left-4 top-4 -ml-px h-full w-0.5 bg-slate-900" aria-hidden="true" />
                          ) : null}
                          <div className="relative flex space-x-3">
                            <div>
                              <span className={`h-8 w-8 rounded-xl flex items-center justify-center ring-8 ring-slate-950/30 ${
                                punch.checkOutTime ? "bg-blue-500/10 text-blue-400" : "bg-emerald-500/10 text-emerald-400"
                              }`}>
                                <CheckCircle className="size-4" />
                              </span>
                            </div>
                            <div className="flex-1 min-w-0 pt-1.5 flex justify-between space-x-4">
                              <div>
                                <p className="text-xs font-semibold text-slate-200">
                                  {punch.employeeName}{" "}
                                  <span className="text-[10px] text-slate-500 font-normal font-mono">({punch.employeeCode})</span>
                                </p>
                                <p className="text-[10px] text-slate-500 mt-0.5">
                                  {punch.checkOutTime ? "Checked out" : "Checked in"}{" "}
                                  {punch.status === "late" && (
                                    <span className="text-amber-500 font-extrabold uppercase text-[8px] tracking-wider ml-1">LATE</span>
                                  )}
                                </p>
                              </div>
                              <div className="text-right text-[10px] whitespace-nowrap text-slate-500">
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

          {/* Quick Actions */}
          <Card className="bg-slate-950/40 border-slate-900 rounded-3xl shadow-xl">
            <CardHeader>
              <CardTitle className="text-base font-bold">Quick Operations</CardTitle>
              <CardDescription className="text-xs text-slate-500">Frequent workspace actions</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3">
              <Link
                href="/dashboard/employees/new"
                className="flex items-center justify-between p-3.5 rounded-2xl border border-slate-900/60 bg-slate-950/40 hover:bg-slate-900/40 transition-colors"
              >
                <div>
                  <div className="font-bold text-xs text-white">Enroll New Staff</div>
                  <div className="text-[10px] text-slate-500 mt-1">Register profiles for biometrics</div>
                </div>
                <ArrowRight className="size-4 text-slate-600" />
              </Link>
              <Link
                href="/dashboard/attendance/adjustments"
                className="flex items-center justify-between p-3.5 rounded-2xl border border-slate-900/60 bg-slate-950/40 hover:bg-slate-900/40 transition-colors"
              >
                <div>
                  <div className="font-bold text-xs text-white">Manual Adjustments</div>
                  <div className="text-[10px] text-slate-500 mt-1">Edit logs and audit excuses</div>
                </div>
                <ArrowRight className="size-4 text-slate-600" />
              </Link>
              <Link
                href="/dashboard/reports"
                className="flex items-center justify-between p-3.5 rounded-2xl border border-slate-900/60 bg-slate-950/40 hover:bg-slate-900/40 transition-colors"
              >
                <div>
                  <div className="font-bold text-xs text-white">Export Sheets</div>
                  <div className="text-[10px] text-slate-500 mt-1">Download monthly attendance reports</div>
                </div>
                <ArrowRight className="size-4 text-slate-600" />
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
