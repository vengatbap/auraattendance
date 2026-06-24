"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Edit, Trash2, Loader, MapPin } from "lucide-react";
import { toast } from "sonner";

interface Site {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  radius: number;
  status: string;
  createdAt: string;
}

export default function SitesPage() {
  const [sites, setSites] = useState<Site[]>([]);
  const [loading, setLoading] = useState(true);

  async function fetchSites() {
    try {
      const res = await fetch("/api/sites");
      if (!res.ok) throw new Error("Failed to fetch sites");
      const data = await res.json();
      setSites(data);
    } catch {
      toast.error("Failed to load sites");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const t = setTimeout(() => {
      fetchSites();
    }, 0);
    return () => clearTimeout(t);
  }, []);
  

  async function deleteSite(id: string) {
    if (!confirm("Are you sure you want to delete this site?")) return;

    try {
      const res = await fetch(`/api/sites/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete site");
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
          <p className="text-slate-400 mt-2">Manage office locations and attendance zones</p>
        </div>
        <Link href="/dashboard/sites/new">
          <Button className="bg-blue-600 hover:bg-blue-700">
            <Plus className="w-4 h-4 mr-2" />
            Add Site
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          <div className="flex items-center justify-center py-12 col-span-full">
            <Loader className="w-6 h-6 animate-spin text-blue-600" />
          </div>
        ) : sites.length === 0 ? (
          <div className="text-center py-12 text-slate-400 col-span-full">No sites found</div>
        ) : (
          sites.map((site) => (
            <Card key={site.id} className="bg-slate-900 border-slate-800 hover:border-slate-700 transition-colors">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-5 h-5 text-blue-600" />
                    <CardTitle className="text-lg">{site.name}</CardTitle>
                  </div>
                  <span
                    className={`px-2 py-1 rounded text-xs font-semibold ${
                      site.status === "active"
                        ? "bg-green-500/20 text-green-400"
                        : "bg-red-500/20 text-red-400"
                    }`}
                  >
                    {site.status}
                  </span>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="text-sm space-y-2">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Latitude:</span>
                    <span className="text-slate-200">{site.latitude.toFixed(6)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Longitude:</span>
                    <span className="text-slate-200">{site.longitude.toFixed(6)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Radius:</span>
                    <span className="text-slate-200">{site.radius}m</span>
                  </div>
                </div>

                <div className="flex gap-2 pt-4">
                  <Link href={`/dashboard/sites/${site.id}`} className="flex-1">
                    <Button variant="ghost" size="sm" className="w-full text-blue-400 hover:bg-blue-500/20">
                      <Edit className="w-4 h-4 mr-2" />
                      Edit
                    </Button>
                  </Link>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-red-400 hover:bg-red-500/20"
                    onClick={() => deleteSite(site.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
