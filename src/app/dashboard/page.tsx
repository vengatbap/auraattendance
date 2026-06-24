import { db } from "@/db";
import { users, sites, employees, attendanceLogs } from "@/db/schema";
import { gte } from "drizzle-orm";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

async function getDashboardData() {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [adminCount, siteCount, employeeCount, todayAttendance] = await Promise.all([
      db.select().from(users).then((u) => u.length),
      db.select().from(sites).then((s) => s.length),
      db.select().from(employees).then((e) => e.length),
      db.query.attendanceLogs.findMany({
        where: gte(attendanceLogs.createdAt, new Date(today)),
        limit: 100,
      }),
    ]);

    const checkedInToday = todayAttendance.filter((log) => log.checkInTime).length;
    const checkedOutToday = todayAttendance.filter((log) => log.checkOutTime).length;

    return {
      adminCount,
      siteCount,
      employeeCount,
      checkedInToday,
      checkedOutToday,
    };
  } catch (error) {
    console.error("Error fetching dashboard data:", error);
    return {
      adminCount: 0,
      siteCount: 0,
      employeeCount: 0,
      checkedInToday: 0,
      checkedOutToday: 0,
    };
  }
}

export default async function DashboardPage() {
  const data = await getDashboardData();

  const stats = [
    {
      title: "Total Admins",
      value: data.adminCount,
      description: "System administrators",
      color: "bg-blue-500",
    },
    {
      title: "Total Sites",
      value: data.siteCount,
      description: "Company locations",
      color: "bg-purple-500",
    },
    {
      title: "Total Employees",
      value: data.employeeCount,
      description: "Active employees",
      color: "bg-green-500",
    },
    {
      title: "Checked In Today",
      value: data.checkedInToday,
      description: "Employees present",
      color: "bg-emerald-500",
    },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-slate-400 mt-2">Welcome to Aura Attendance Management System</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => (
          <Card key={stat.title} className="bg-slate-900 border-slate-800">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-slate-400">{stat.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-end justify-between">
                <div className="text-3xl font-bold">{stat.value}</div>
                <div className={`w-12 h-12 rounded-lg ${stat.color} opacity-20`} />
              </div>
              <p className="text-xs text-slate-500 mt-2">{stat.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Recent Activity */}
      <Card className="bg-slate-900 border-slate-800">
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Common tasks</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Link
              href="/dashboard/admins/new"
              className="p-4 rounded-lg border border-slate-700 hover:border-blue-600 hover:bg-slate-800/50 transition-colors cursor-pointer"
            >
              <div className="font-semibold text-sm mb-1">Add Admin</div>
              <div className="text-xs text-slate-500">Create new administrator</div>
            </Link>
            <Link
              href="/dashboard/sites"
              className="p-4 rounded-lg border border-slate-700 hover:border-blue-600 hover:bg-slate-800/50 transition-colors cursor-pointer"
            >
              <div className="font-semibold text-sm mb-1">Manage Sites</div>
              <div className="text-xs text-slate-500">View and edit locations</div>
            </Link>
            <Link
              href="/dashboard/employees/new"
              className="p-4 rounded-lg border border-slate-700 hover:border-blue-600 hover:bg-slate-800/50 transition-colors cursor-pointer"
            >
              <div className="font-semibold text-sm mb-1">Add Employee</div>
              <div className="text-xs text-slate-500">Enroll new employee</div>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
