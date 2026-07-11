"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Loader, Save, ToggleLeft, ToggleRight, Building } from "lucide-react";

interface Tenant {
  id: string;
  name: string;
}

interface FeatureFlags {
  face: boolean;
  gps: boolean;
  qr: boolean;
  offline: boolean;
  adjustments: boolean;
  reports: boolean;
  analytics: boolean;
}

const defaultFlags: FeatureFlags = {
  face: true,
  gps: true,
  qr: false,
  offline: true,
  adjustments: true,
  reports: true,
  analytics: true,
};

export default function AdminFeaturesPage() {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [selectedTenantId, setSelectedTenantId] = useState<string>("");
  const [flags, setFlags] = useState<FeatureFlags>(defaultFlags);
  const [loadingTenants, setLoadingTenants] = useState(true);
  const [loadingFlags, setLoadingFlags] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function loadTenants() {
      try {
        const res = await fetch("/api/admin/tenants");
        if (!res.ok) throw new Error();
        const data = await res.json();
        setTenants(data);
        if (data.length > 0) {
          setSelectedTenantId(data[0].id);
        }
      } catch {
        toast.error("Failed to load tenants list");
      } finally {
        setLoadingTenants(false);
      }
    }
    loadTenants();
  }, []);

  useEffect(() => {
    if (!selectedTenantId) return;

    async function loadFlags() {
      setLoadingFlags(true);
      try {
        const res = await fetch(`/api/admin/features?organizationId=${selectedTenantId}`);
        if (!res.ok) throw new Error();
        const data = await res.json();
        setFlags({
          ...defaultFlags,
          ...(data.featureFlags as Record<string, boolean>),
        });
      } catch {
        toast.error("Failed to fetch feature flags for tenant");
      } finally {
        setLoadingFlags(false);
      }
    }
    loadFlags();
  }, [selectedTenantId]);

  function toggleFlag(key: keyof FeatureFlags) {
    setFlags((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  }

  async function handleSave() {
    if (!selectedTenantId) return;
    setSaving(true);
    try {
      const res = await fetch("/api/admin/features", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          organizationId: selectedTenantId,
          featureFlags: flags,
        }),
      });
      if (!res.ok) throw new Error();
      toast.success("Feature flags saved successfully");
    } catch {
      toast.error("Failed to update feature flags");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-black tracking-tight text-white">Feature Flag Controls</h1>
        <p className="text-zinc-500 mt-1 text-sm">Enable or disable specific features dynamically per business tenant.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[0.8fr_1.2fr] gap-6">
        {/* Left: Tenant Selector */}
        <Card className="bg-[#0e0e11] border-zinc-900 rounded-2xl shadow-md h-fit">
          <CardHeader>
            <CardTitle className="text-sm font-bold text-white flex items-center gap-2">
              <Building className="w-4.5 h-4.5 text-zinc-400" />
              Select Tenant
            </CardTitle>
            <CardDescription className="text-xs text-zinc-500">Pick a business client organization.</CardDescription>
          </CardHeader>
          <CardContent>
            {loadingTenants ? (
              <div className="flex items-center justify-center py-6">
                <Loader className="w-5 h-5 animate-spin text-amber-500" />
              </div>
            ) : tenants.length === 0 ? (
              <div className="text-center py-6 text-zinc-600 text-xs font-semibold">No tenants available</div>
            ) : (
              <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                {tenants.map((t) => {
                  const isSelected = selectedTenantId === t.id;
                  return (
                    <button
                      key={t.id}
                      onClick={() => setSelectedTenantId(t.id)}
                      className={`w-full text-left p-3 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                        isSelected
                          ? "bg-[#18181b] border-zinc-800 text-white shadow-sm"
                          : "bg-transparent border-transparent text-zinc-400 hover:text-zinc-200 hover:bg-zinc-950/40"
                      }`}
                    >
                      {t.name}
                    </button>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Right: Feature Toggles */}
        <Card className="bg-[#0e0e11] border-zinc-900 rounded-2xl shadow-md">
          <CardHeader>
            <CardTitle className="text-sm font-bold text-white flex items-center gap-2">
              <ToggleRight className="w-4.5 h-4.5 text-amber-500" />
              Feature Flags Setup
            </CardTitle>
            <CardDescription className="text-xs text-zinc-500">
              Toggle specific modules for the selected organization.
            </CardDescription>
          </CardHeader>
          <CardContent className="divide-y divide-zinc-900/60 border-t border-zinc-900">
            {loadingFlags ? (
              <div className="flex items-center justify-center py-12">
                <Loader className="w-6 h-6 animate-spin text-amber-500" />
              </div>
            ) : (
              <div className="py-2 space-y-1.5">
                {[
                  { key: "face", label: "Face Biometrics Match", desc: "Allows checking identity via camera scanner." },
                  { key: "gps", label: "GPS Geofencing Detection", desc: "Verifies employee proximity coordinates." },
                  { key: "qr", label: "QR Punch Scanning", desc: "Allows QR code verification." },
                  { key: "offline", label: "Offline Punch Syncing", desc: "Allows caching logs inside local browser memory." },
                  { key: "adjustments", label: "Log Adjustments Override", desc: "Allows manager corrections and excuses." },
                  { key: "reports", label: "Exports Reports Engine", desc: "Allows downloading monthly sheets." },
                  { key: "analytics", label: "Realtime Analytics Graphs", desc: "Renders graphical metrics on dashboard." },
                ].map((feat) => {
                  const val = flags[feat.key as keyof FeatureFlags];
                  return (
                    <div key={feat.key} className="flex justify-between items-center py-3.5 first:pt-1">
                      <div>
                        <div className="font-bold text-zinc-200 text-xs">{feat.label}</div>
                        <div className="text-[10px] text-zinc-500 mt-0.5 max-w-sm">{feat.desc}</div>
                      </div>
                      <button
                        onClick={() => toggleFlag(feat.key as keyof FeatureFlags)}
                        className="text-zinc-400 hover:text-white cursor-pointer"
                      >
                        {val ? (
                          <ToggleRight className="w-10 h-10 text-emerald-500" />
                        ) : (
                          <ToggleLeft className="w-10 h-10 text-zinc-700" />
                        )}
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
          <CardFooter className="border-t border-zinc-900 bg-zinc-950/20 py-4 flex justify-end">
            <Button
              onClick={handleSave}
              disabled={saving || loadingFlags || !selectedTenantId}
              className="bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs px-5 py-2 rounded-xl flex items-center gap-1.5 cursor-pointer shadow-md"
            >
              <Save className="w-4 h-4" />
              {saving ? "Saving..." : "Save Feature Flags"}
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
