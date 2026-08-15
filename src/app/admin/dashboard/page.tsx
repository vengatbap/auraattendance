import { SystemHealthService } from "@/modules/platform/system/service/system-health.service";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Building2, Users, Clock, ShieldAlert, CheckCircle2, Calendar } from "lucide-react";

async function getStats() {
  return SystemHealthService.getDashboardSystemStats();
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
      title: "Active Users",
      value: stats.activeSessions,
      description: "Users with active sessions",
      icon: Users,
      color: "from-purple-600/10 to-pink-600/10 text-purple-500 border-purple-500/20",
    },
    {
      title: "Today's Punches",
      value: stats.punchCount,
      description: "Total biometric check-ins",
      icon: Clock,
      color: "from-emerald-600/10 to-teal-600/10 text-emerald-500 border-emerald-500/20",
    },
    {
      title: "Trial Tenants",
      value: stats.trialCount,
      description: "Organizations on trial plan",
      icon: Calendar,
      color: "from-amber-600/10 to-orange-600/10 text-amber-500 border-amber-500/20",
    },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-black tracking-tight text-white">System Overview</h1>
        <p className="text-zinc-500 mt-1 text-sm">Global business stats and customer metrics.</p>
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
        {/* Left: Recent Signups */}
        <Card className="bg-[#0e0e11] border-zinc-900 rounded-2xl shadow-md">
          <CardHeader>
            <CardTitle className="text-sm font-bold text-white flex items-center gap-2">
              <CheckCircle2 className="size-4.5 text-emerald-500" />
              Recent Tenant Signups
            </CardTitle>
            <CardDescription className="text-xs text-zinc-500">Newly registered organizations on the platform.</CardDescription>
          </CardHeader>
          <CardContent className="py-4">
            <div className="space-y-4">
              {stats.recentOrganizations.length === 0 ? (
                <p className="text-zinc-500 text-xs text-center py-4">No recent signups found.</p>
              ) : (
                stats.recentOrganizations.map((org) => (
                  <div key={org.id} className="flex justify-between items-center p-3 rounded-xl bg-zinc-950/40 border border-zinc-900">
                    <div>
                      <div className="text-xs font-bold text-white">{org.name}</div>
                      <div className="text-[10px] text-zinc-500 mt-0.5">slug: {org.slug}</div>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full border border-zinc-800 bg-zinc-900 text-zinc-400">
                        {org.subscriptionPlan}
                      </span>
                      <div className="text-[9px] text-zinc-500 mt-1">
                        {new Date(org.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Right: Tenant Operational Status */}
        <Card className="bg-[#0e0e11] border-zinc-900 rounded-2xl shadow-md">
          <CardHeader>
            <CardTitle className="text-sm font-bold text-white flex items-center gap-2">
              <ShieldAlert className="size-4.5 text-amber-500" />
              Tenant Operational Status
            </CardTitle>
            <CardDescription className="text-xs text-zinc-500">Global account status indicators.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3.5 py-4">
            {[
              { label: "Suspended Organizations", count: stats.suspendedCount, color: stats.suspendedCount > 0 ? "text-rose-500 bg-rose-500/10 border-rose-500/20" : "text-zinc-500 bg-zinc-900/40 border-zinc-900" },
              { label: "Trial Period Active", count: stats.trialCount, color: "text-amber-500 bg-amber-500/10 border-amber-500/20" },
              { label: "Active Portal Sessions", count: stats.activeSessions, color: "text-emerald-500 bg-emerald-500/10 border-emerald-500/20" },
            ].map((item) => (
              <div key={item.label} className="flex justify-between items-center p-3 rounded-xl bg-zinc-950/40 border border-zinc-900">
                <span className="text-xs font-semibold text-zinc-300">{item.label}</span>
                <span className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${item.color}`}>
                  {item.count}
                </span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
