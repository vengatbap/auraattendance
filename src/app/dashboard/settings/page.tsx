"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Save } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export default function SettingsPage() {
  const [settings, setSettings] = useState({
    companyName: "AURA",
    workingHoursStart: "08:00",
    workingHoursEnd: "17:00",
    gpsRadius: 50,
    timezone: "Asia/Bahrain",
  });

  async function handleSave() {
    try {
      toast.success("Settings saved successfully");
    } catch {
      toast.error("Failed to save settings");
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="text-slate-400 mt-2">System configuration and preferences</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Company Settings */}
        <Card className="bg-slate-900 border-slate-800 lg:col-span-2">
          <CardHeader>
            <CardTitle>Company Settings</CardTitle>
            <CardDescription>Basic company information</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <Label className="text-slate-300">Company Name</Label>
              <Input
                value={settings.companyName}
                onChange={(e) => setSettings({ ...settings, companyName: e.target.value })}
                className="bg-slate-950/50 border-slate-800 text-slate-100 mt-2"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-slate-300">Working Hours Start</Label>
                <Input
                  type="time"
                  value={settings.workingHoursStart}
                  onChange={(e) => setSettings({ ...settings, workingHoursStart: e.target.value })}
                  className="bg-slate-950/50 border-slate-800 text-slate-100 mt-2"
                />
              </div>
              <div>
                <Label className="text-slate-300">Working Hours End</Label>
                <Input
                  type="time"
                  value={settings.workingHoursEnd}
                  onChange={(e) => setSettings({ ...settings, workingHoursEnd: e.target.value })}
                  className="bg-slate-950/50 border-slate-800 text-slate-100 mt-2"
                />
              </div>
            </div>

            <div>
              <Label className="text-slate-300">GPS Radius (meters)</Label>
              <Input
                type="number"
                value={settings.gpsRadius}
                onChange={(e) => setSettings({ ...settings, gpsRadius: parseInt(e.target.value) })}
                className="bg-slate-950/50 border-slate-800 text-slate-100 mt-2"
              />
            </div>

            <div>
              <Label className="text-slate-300">Timezone</Label>
              <Input
                value={settings.timezone}
                onChange={(e) => setSettings({ ...settings, timezone: e.target.value })}
                className="bg-slate-950/50 border-slate-800 text-slate-100 mt-2"
              />
            </div>

            <Button onClick={handleSave} className="bg-blue-600 hover:bg-blue-700">
              <Save className="w-4 h-4 mr-2" />
              Save Settings
            </Button>
          </CardContent>
        </Card>

        {/* Quick Info */}
        <Card className="bg-slate-900 border-slate-800">
          <CardHeader>
            <CardTitle className="text-lg">System Info</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            <div>
              <div className="text-slate-500">Version</div>
              <div className="text-slate-100 font-semibold">1.0.0</div>
            </div>
            <div>
              <div className="text-slate-500">Environment</div>
              <div className="text-slate-100 font-semibold">Production</div>
            </div>
            <div>
              <div className="text-slate-500">Last Updated</div>
              <div className="text-slate-100 font-semibold">{new Date().toLocaleDateString()}</div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
