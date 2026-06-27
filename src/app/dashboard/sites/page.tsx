"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Edit, Trash2, MapPin } from "lucide-react";
import { toast } from "sonner";
import { SkeletonCard } from "@/components/ui/skeletons";
import { EmptyState } from "@/components/ui/empty-state";

interface Site {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  radius: number;
  status: string;
  allowedDevices: string;
  createdAt: string;
}

export default function SitesPage() {
  const [sites, setSites] = useState<Site[]>([]);
  const [loading, setLoading] = useState(true);

  async function fetchSites() {
    try {
      const res = await fetch("/api/sites");
      if (!res.ok) throw new Error();
      const result = await res.json();
      if (result.success && Array.isArray(result.data)) {
        setSites(result.data);
      } else {
        throw new Error();
      }
    } catch {
      toast.error("Failed to load sites");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const t = setTimeout(() => {
      void fetchSites();
    }, 0);
    return () => clearTimeout(t);
  }, []);

  async function deleteSite(id: string) {
    if (!confirm("Are you sure you want to delete this site?")) return;

    try {
      const res = await fetch(`/api/sites/${id}`, { method: "DELETE" });
      const result = await res.json();
      if (!res.ok || !result.success) throw new Error();
      setSites(sites.filter((s) => s.id !== id));
      toast.success("Site deleted successfully");
    } catch {
      toast.error("Failed to delete site");
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Company Sites</h1>
          <p className="text-slate-400 mt-2">Manage office locations and geofence zones</p>
        </div>
        <Link href="/dashboard/sites/new">
          <Button className="bg-blue-600 hover:bg-blue-700">
            <Plus className="w-4 h-4 mr-2" />
            Add Site
          </Button>
        </Link>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 3 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      ) : sites.length === 0 ? (
        <EmptyState
          title="No Sites Created Yet"
          description="Geofence locations are required before employees can punch. Get started by creating your first site."
          icon={MapPin}
          action={
            <Link href="/dashboard/sites/new">
              <Button className="bg-blue-600 hover:bg-blue-700">
                <Plus className="w-4 h-4 mr-2" />
                Add First Site
              </Button>
            </Link>
          }
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sites.map((site) => (
            <Card key={site.id} className="bg-slate-950/40 border-slate-900 hover:border-slate-800 transition-all rounded-2xl shadow-xl">
              <CardHeader className="pb-3 border-b border-slate-900/60 mb-2">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-5 h-5 text-blue-500" />
                    <CardTitle className="text-base font-bold text-slate-100">{site.name}</CardTitle>
                  </div>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wide ${
                      site.status === "active"
                        ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                        : "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                    }`}
                  >
                    {site.status}
                  </span>
                </div>
              </CardHeader>
              <CardContent className="space-y-4 pt-2">
                <div className="text-xs space-y-2">
                  <div className="flex justify-between border-b border-slate-900/30 pb-1.5">
                    <span className="text-slate-400">Latitude:</span>
                    <span className="text-slate-200 font-mono">{site.latitude.toFixed(6)}</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-900/30 pb-1.5">
                    <span className="text-slate-400">Longitude:</span>
                    <span className="text-slate-200 font-mono">{site.longitude.toFixed(6)}</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-900/30 pb-1.5">
                    <span className="text-slate-400">Radius Limit:</span>
                    <span className="text-slate-200 font-bold">{site.radius} meters</span>
                  </div>
                  <div className="flex justify-between pb-0.5">
                    <span className="text-slate-400">Allowed Devices:</span>
                    <span className="text-slate-200 capitalize">{site.allowedDevices}</span>
                  </div>
                </div>

                <div className="flex gap-2 pt-2 border-t border-slate-900">
                  <Link href={`/dashboard/sites/${site.id}`} className="flex-1">
                    <Button variant="ghost" size="sm" className="w-full text-blue-500 hover:bg-blue-600/10">
                      <Edit className="w-4 h-4 mr-2" />
                      Edit Details
                    </Button>
                  </Link>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-red-500 hover:bg-red-600/10"
                    onClick={() => deleteSite(site.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
