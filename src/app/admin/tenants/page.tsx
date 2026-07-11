"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Loader, Search, RefreshCw, AlertTriangle, ShieldCheck } from "lucide-react";

interface Tenant {
  id: string;
  name: string;
  slug: string;
  status: string;
  subscriptionPlan: string;
  createdAt: string;
  trialEndsAt: string | null;
}

export default function AdminTenantsPage() {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [submittingId, setSubmittingId] = useState<string | null>(null);

  async function fetchTenants() {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/tenants");
      if (!res.ok) throw new Error();
      const data = await res.json();
      setTenants(data);
    } catch {
      toast.error("Failed to load tenants list");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchTenants();
  }, []);

  async function updatePlan(id: string, plan: "trial" | "standard" | "enterprise") {
    setSubmittingId(id);
    try {
      const res = await fetch(`/api/admin/tenants/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subscriptionPlan: plan }),
      });
      if (!res.ok) throw new Error();
      toast.success("Subscription plan updated successfully");
      fetchTenants();
    } catch {
      toast.error("Failed to update plan");
    } finally {
      setSubmittingId(null);
    }
  }

  async function toggleStatus(id: string, currentStatus: string) {
    setSubmittingId(id);
    const newStatus = currentStatus === "active" ? "suspended" : "active";
    try {
      const res = await fetch(`/api/admin/tenants/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) throw new Error();
      toast.success(`Tenant ${newStatus === "active" ? "activated" : "suspended"} successfully`);
      fetchTenants();
    } catch {
      toast.error("Failed to update status");
    } finally {
      setSubmittingId(null);
    }
  }

  const filteredTenants = tenants.filter((t) =>
    [t.name, t.slug, t.status, t.subscriptionPlan].some((val) =>
      val.toLowerCase().includes(searchTerm.toLowerCase())
    )
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-white">Tenants Directory</h1>
          <p className="text-zinc-500 mt-1 text-sm">Manage business tenants and subscription packaging rules.</p>
        </div>
        <Button
          onClick={fetchTenants}
          variant="outline"
          className="border-zinc-800 text-zinc-300 hover:bg-zinc-900 cursor-pointer"
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>

      <div className="flex gap-4 items-center">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-3 w-4 h-4 text-zinc-600" />
          <input
            placeholder="Search tenant name, slug, status..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-zinc-950/50 border border-zinc-900 focus:border-zinc-800 rounded-xl pl-9 pr-4 py-2.5 text-xs text-zinc-200 outline-none placeholder:text-zinc-700"
          />
        </div>
      </div>

      <Card className="bg-[#0e0e11] border-zinc-900 rounded-2xl shadow-md">
        <CardHeader>
          <CardTitle className="text-sm font-bold text-white">Registered Organizations</CardTitle>
          <CardDescription className="text-xs text-zinc-500">Total organizations found: {filteredTenants.length}</CardDescription>
        </CardHeader>
        <CardContent className="p-0 border-t border-zinc-900">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader className="w-6 h-6 animate-spin text-amber-500" />
            </div>
          ) : filteredTenants.length === 0 ? (
            <div className="text-center py-12 text-zinc-600 text-xs font-semibold">No tenants found</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-zinc-950/40 text-[10px] font-black text-zinc-500 uppercase tracking-wider border-b border-zinc-900">
                  <tr>
                    <th className="py-3 px-6">Tenant Info</th>
                    <th className="py-3 px-6">Link Slug</th>
                    <th className="py-3 px-6">Created Date</th>
                    <th className="py-3 px-6">Status</th>
                    <th className="py-3 px-6">Subscription Plan</th>
                    <th className="py-3 px-6 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-900">
                  {filteredTenants.map((t) => (
                    <tr key={t.id} className="hover:bg-zinc-950/20 transition-colors">
                      <td className="py-4 px-6">
                        <div className="font-bold text-zinc-200">{t.name}</div>
                        <div className="text-[10px] text-zinc-600 font-mono mt-0.5">{t.id}</div>
                      </td>
                      <td className="py-4 px-6 text-zinc-400 font-mono">/{t.slug}</td>
                      <td className="py-4 px-6 text-zinc-400">{new Date(t.createdAt).toLocaleDateString()}</td>
                      <td className="py-4 px-6">
                        <span
                          className={`inline-flex px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider ${
                            t.status === "active"
                              ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                              : "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                          }`}
                        >
                          {t.status}
                        </span>
                      </td>
                      <td className="py-4 px-6">
                        <span
                          className={`inline-flex px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider ${
                            t.subscriptionPlan === "enterprise"
                              ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                              : t.subscriptionPlan === "standard"
                              ? "bg-purple-500/10 text-purple-400 border border-purple-500/20"
                              : "bg-blue-500/10 text-blue-400 border border-blue-500/20"
                          }`}
                        >
                          {t.subscriptionPlan}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-right space-x-1.5 whitespace-nowrap">
                        {/* Plan selection buttons */}
                        <div className="inline-flex gap-1">
                          {(["trial", "standard", "enterprise"] as const).map((plan) => (
                            <Button
                              key={plan}
                              onClick={() => updatePlan(t.id, plan)}
                              disabled={t.subscriptionPlan === plan || submittingId !== null}
                              size="sm"
                              variant="ghost"
                              className={`h-7 px-2 text-[9px] font-bold rounded-lg cursor-pointer ${
                                t.subscriptionPlan === plan
                                  ? "bg-zinc-800 text-white"
                                  : "text-zinc-500 hover:text-zinc-200"
                              }`}
                            >
                              {plan.toUpperCase()}
                            </Button>
                          ))}
                        </div>

                        {/* Suspend/Activate button */}
                        <Button
                          onClick={() => toggleStatus(t.id, t.status)}
                          disabled={submittingId !== null}
                          size="sm"
                          variant="ghost"
                          className={`h-7 px-3 text-[9px] font-black rounded-lg uppercase tracking-wider cursor-pointer border ${
                            t.status === "active"
                              ? "text-rose-500 hover:bg-rose-500/10 border-rose-500/20"
                              : "text-emerald-500 hover:bg-emerald-500/10 border-emerald-500/20"
                          }`}
                        >
                          {t.status === "active" ? (
                            <span className="flex items-center gap-1"><AlertTriangle className="w-3 h-3" /> Suspend</span>
                          ) : (
                            <span className="flex items-center gap-1"><ShieldCheck className="w-3 h-3" /> Activate</span>
                          )}
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
