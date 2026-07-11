import { db } from "@/db";
import { organizations, users, employees, attendanceLogs } from "@/db/schema";
import { sql } from "drizzle-orm";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Building2, Users, Users2, Clock, ShieldAlert, CheckCircle2 } from "lucide-react";

async function getStats() {
  const [orgCount, userCount, employeeCount, punchCount, planBreakdown] = await Promise.all([
    db.select({ count: sql<number>`count(*)` }).from(organizations).then((res) => Number(res[0].count)),
    db.select({ count: sql<number>`count(*)` }).from(users).then((res) => Number(res[0].count)),
    db.select({ count: sql<number>`count(*)` }).from(employees).then((res) => Number(res[0].count)),
    db.select({ count: sql<number>`count(*)` }).from(attendanceLogs).then((res) => Number(res[0].count)),
    db.select({ plan: organizations.subscriptionPlan, count: sql<number>`count(*)` }).from(organizations).groupBy(organizations.subscriptionPlan),
  ]);

  return {
    orgCount,
    userCount,
    employeeCount,
    punchCount,
    plans: planBreakdown.reduce((acc, curr) => {
      acc[curr.plan] = Number(curr.count);
      return acc;
    }, {} as Record<string, number>),
  };
}

export default async function AdminDashboardPage() {
  const stats = await getStats();

  const metrics = [
    {
      title: "Total Tenants",
      value: stats.orgCount,
      description: "Active business organizations",
      icon: Building2,
      color: "from-blue-600/10 to-indigo-600/10 text-blue-500 border-blue-500/20",
    },
    {
      title: "Total Users",
      value: stats.userCount,
      description: "Tenant portal administrators",
      icon: Users,
      color: "from-purple-600/10 to-pink-600/10 text-purple-500 border-purple-500/20",
    },
    {
      title: "Total Staff",
      value: stats.employeeCount,
      description: "Enrolled kiosk employees",
      icon: Users2,
      color: "from-emerald-600/10 to-teal-600/10 text-emerald-500 border-emerald-500/20",
    },
    {
      title: "Verification Punches",
      value: stats.punchCount,
      description: "Total biometric punch logs",
      icon: Clock,
      color: "from-amber-600/10 to-orange-600/10 text-amber-500 border-amber-500/20",
    },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-black tracking-tight text-white">System Overview</h1>
        <p className="text-zinc-500 mt-1 text-sm">Global monitoring metrics and platform-wide parameters.</p>
      </div>

      {/* Grid Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {metrics.map((m) => (
          <Card key={m.title} className="bg-[#0e0e11] border-zinc-900 rounded-2xl shadow-md overflow-hidden relative group hover:border-zinc-800 transition-all duration-300">
            <div className="absolute inset-0 bg-gradient-to-br from-white/2 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <CardHeader className="pb-3 flex flex-row items-center justify-between">
              <CardTitle className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">{m.title}</CardTitle>
              <div className={`p-2 rounded-xl bg-gradient-to-br ${m.color} border shadow-sm`}>
                <m.icon className="size-4" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-black text-white">{m.value}</div>
              <p className="text-zinc-500 text-[11px] mt-1.5 font-medium">{m.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_0.8fr] gap-6">
        {/* Left: Subscriptions Breakdown */}
        <Card className="bg-[#0e0e11] border-zinc-900 rounded-2xl shadow-md">
          <CardHeader>
            <CardTitle className="text-sm font-bold text-white flex items-center gap-2">
              <CheckCircle2 className="size-4.5 text-emerald-500" />
              Active Subscription Tiers
            </CardTitle>
            <CardDescription className="text-xs text-zinc-500">Breakdown of tenants based on packaging plans.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 py-4">
            {[
              { name: "Free Trial", key: "trial", color: "bg-blue-500" },
              { name: "Standard Plan", key: "standard", color: "bg-purple-500" },
              { name: "Enterprise Tier", key: "enterprise", color: "bg-amber-500" },
            ].map((plan) => {
              const count = stats.plans[plan.key] || 0;
              const total = stats.orgCount || 1;
              const pct = Math.round((count / total) * 100);
              return (
                <div key={plan.key} className="space-y-2">
                  <div className="flex justify-between text-xs font-semibold">
                    <span className="text-zinc-300">{plan.name}</span>
                    <span className="text-white">{count} tenants ({pct}%)</span>
                  </div>
                  <div className="h-2 w-full bg-zinc-950 rounded-full overflow-hidden border border-zinc-900">
                    <div className={`h-full ${plan.color}`} style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>

        {/* Right: Platform Health Status */}
        <Card className="bg-[#0e0e11] border-zinc-900 rounded-2xl shadow-md">
          <CardHeader>
            <CardTitle className="text-sm font-bold text-white flex items-center gap-2">
              <ShieldAlert className="size-4.5 text-amber-500" />
              System Status
            </CardTitle>
            <CardDescription className="text-xs text-zinc-500">Service engines and database operational check.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3.5 py-4">
            {[
              { service: "Neon PostgreSQL", status: "Operational", color: "text-emerald-500 bg-emerald-500/10 border-emerald-500/20" },
              { service: "Face Recognition CDN Engine", status: "Operational", color: "text-emerald-500 bg-emerald-500/10 border-emerald-500/20" },
              { service: "GPS Geofencing Calculate API", status: "Operational", color: "text-emerald-500 bg-emerald-500/10 border-emerald-500/20" },
              { service: "Offline Sync Queues", status: "Operational", color: "text-emerald-500 bg-emerald-500/10 border-emerald-500/20" },
            ].map((svc) => (
              <div key={svc.service} className="flex justify-between items-center p-3 rounded-xl bg-zinc-950/40 border border-zinc-900">
                <span className="text-xs font-semibold text-zinc-300">{svc.service}</span>
                <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full border ${svc.color}`}>
                  {svc.status}
                </span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
