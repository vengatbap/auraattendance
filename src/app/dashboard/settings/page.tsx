"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
interface SwitchProps {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  disabled?: boolean;
}

function Switch({ checked, onCheckedChange, disabled }: SwitchProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onCheckedChange(!checked)}
      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2 focus:ring-offset-slate-950 ${
        checked ? "bg-blue-600" : "bg-slate-800"
      } ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
    >
      <span
        aria-hidden="true"
        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
          checked ? "translate-x-5" : "translate-x-0"
        }`}
      />
    </button>
  );
}

import { Save, Loader, Key, Mail, ShieldAlert, Phone } from "lucide-react";
import { toast } from "sonner";

export default function SettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [apiKey, setApiKey] = useState("");

  const [settings, setSettings] = useState({
    name: "",
    companyName: "",
    timezone: "UTC",
    supportEmail: "",
    allowMultiplePunches: true,
    minimumPunchGapMinutes: 30,
    autoCheckout: false,
    autoCheckoutTime: "23:59",
    gracePeriodMinutes: 15,
    lateAfterTime: "09:15",
    faceMatchThreshold: 0.6,
    whatsappEnabled: false,
    smsEnabled: false,
    smtpHost: "",
    smtpPort: 587,
    smtpUser: "",
    smtpPass: "",
    smtpFromEmail: "",
  });

  useEffect(() => {
    async function loadSettings() {
      try {
        const res = await fetch("/api/settings");
        if (!res.ok) throw new Error();
        const result = await res.json();
        if (result.success && result.data) {
          const org = result.data;
          setSettings({
            name: org.name || "",
            companyName: org.companyName || "",
            timezone: org.timezone || "UTC",
            supportEmail: org.supportEmail || "",
            allowMultiplePunches: org.allowMultiplePunches ?? true,
            minimumPunchGapMinutes: org.minimumPunchGapMinutes ?? 30,
            autoCheckout: org.autoCheckout ?? false,
            autoCheckoutTime: org.autoCheckoutTime || "23:59",
            gracePeriodMinutes: org.gracePeriodMinutes ?? 15,
            lateAfterTime: org.lateAfterTime || "09:15",
            faceMatchThreshold: org.faceMatchThreshold ?? 0.6,
            whatsappEnabled: org.whatsappEnabled ?? false,
            smsEnabled: org.smsEnabled ?? false,
            smtpHost: org.smtpSettings?.host || "",
            smtpPort: org.smtpSettings?.port || 587,
            smtpUser: org.smtpSettings?.user || "",
            smtpPass: org.smtpSettings?.pass || "",
            smtpFromEmail: org.smtpSettings?.fromEmail || "",
          });
        }
      } catch {
        toast.error("Failed to load settings");
      } finally {
        setLoading(false);
      }
    }
    void loadSettings();
  }, []);

  async function handleSave() {
    setSaving(true);
    try {
      const payload = {
        name: settings.name,
        companyName: settings.companyName,
        timezone: settings.timezone,
        supportEmail: settings.supportEmail || null,
        allowMultiplePunches: settings.allowMultiplePunches,
        minimumPunchGapMinutes: settings.minimumPunchGapMinutes,
        autoCheckout: settings.autoCheckout,
        autoCheckoutTime: settings.autoCheckoutTime,
        gracePeriodMinutes: settings.gracePeriodMinutes,
        lateAfterTime: settings.lateAfterTime,
        faceMatchThreshold: settings.faceMatchThreshold,
        whatsappEnabled: settings.whatsappEnabled,
        smsEnabled: settings.smsEnabled,
        smtpSettings: settings.smtpHost
          ? {
              host: settings.smtpHost,
              port: settings.smtpPort,
              user: settings.smtpUser,
              pass: settings.smtpPass,
              fromEmail: settings.smtpFromEmail,
            }
          : null,
      };

      const res = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const result = await res.json();
      if (!res.ok || !result.success) throw new Error();

      toast.success("Settings updated successfully");
    } catch {
      toast.error("Failed to save settings");
    } finally {
      setSaving(false);
    }
  }

  function generateApiKey() {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    let token = "aura_live_";
    for (let i = 0; i < 32; i++) {
      token += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setApiKey(token);
    toast.success("New developer API Key generated!");
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold">Settings</h1>
          <p className="text-slate-400 mt-2">Manage workspace preferences, alerts configurations, and API keys</p>
        </div>
        <Button onClick={handleSave} disabled={saving} className="bg-blue-600 hover:bg-blue-700 h-11 px-5 rounded-2xl font-bold">
          {saving ? <Loader className="size-4 animate-spin mr-2" /> : <Save className="size-4 mr-2" />}
          Save Configuration
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Side forms */}
        <div className="lg:col-span-2 space-y-6">
          {/* General Company Configuration */}
          <Card className="bg-slate-950/40 border-slate-900 rounded-3xl shadow-xl">
            <CardHeader>
              <CardTitle className="text-base font-bold">Organization Profiles</CardTitle>
              <CardDescription className="text-slate-500 text-xs">Primary naming and timezone defaults.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label className="text-slate-300 text-xs font-semibold">Organization Slug Name *</Label>
                  <Input
                    value={settings.name}
                    onChange={(e) => setSettings({ ...settings, name: e.target.value })}
                    className="bg-slate-950 border-slate-900 text-slate-100 placeholder:text-slate-700"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-slate-300 text-xs font-semibold">Corporate Company Name</Label>
                  <Input
                    value={settings.companyName}
                    onChange={(e) => setSettings({ ...settings, companyName: e.target.value })}
                    placeholder="e.g. Aura Corp"
                    className="bg-slate-950 border-slate-900 text-slate-100 placeholder:text-slate-700"
                  />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label className="text-slate-300 text-xs font-semibold">Timezone</Label>
                  <Input
                    value={settings.timezone}
                    onChange={(e) => setSettings({ ...settings, timezone: e.target.value })}
                    placeholder="UTC"
                    className="bg-slate-950 border-slate-900 text-slate-100 font-mono"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-slate-300 text-xs font-semibold">Support Contact Email</Label>
                  <Input
                    type="email"
                    value={settings.supportEmail}
                    onChange={(e) => setSettings({ ...settings, supportEmail: e.target.value })}
                    placeholder="support@company.com"
                    className="bg-slate-950 border-slate-900 text-slate-100"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Punching Rules & Limits */}
          <Card className="bg-slate-950/40 border-slate-900 rounded-3xl shadow-xl">
            <CardHeader>
              <CardTitle className="text-base font-bold">Attendance Verification Rules</CardTitle>
              <CardDescription className="text-slate-500 text-xs">Biometrics thresholds and punch grace limit criteria.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label className="text-slate-300 text-xs font-semibold">Shift Starts Late After *</Label>
                  <Input
                    type="time"
                    value={settings.lateAfterTime}
                    onChange={(e) => setSettings({ ...settings, lateAfterTime: e.target.value })}
                    className="bg-slate-950 border-slate-900 text-slate-100 font-mono"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-slate-300 text-xs font-semibold">Grace Period Duration (minutes)</Label>
                  <Input
                    type="number"
                    value={settings.gracePeriodMinutes}
                    onChange={(e) => setSettings({ ...settings, gracePeriodMinutes: parseInt(e.target.value) || 0 })}
                    className="bg-slate-950 border-slate-900 text-slate-100"
                  />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label className="text-slate-300 text-xs font-semibold">Minimum Punch Gap (minutes)</Label>
                  <Input
                    type="number"
                    value={settings.minimumPunchGapMinutes}
                    onChange={(e) => setSettings({ ...settings, minimumPunchGapMinutes: parseInt(e.target.value) || 0 })}
                    className="bg-slate-950 border-slate-900 text-slate-100"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-slate-300 text-xs font-semibold">Face Cosine Match Quality Threshold</Label>
                  <Input
                    type="number"
                    step="0.05"
                    value={settings.faceMatchThreshold}
                    onChange={(e) => setSettings({ ...settings, faceMatchThreshold: parseFloat(e.target.value) || 0.6 })}
                    className="bg-slate-950 border-slate-900 text-slate-100"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-900 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-xs font-bold text-slate-200">Allow Multiple Punches Daily</Label>
                    <p className="text-[10px] text-slate-500 mt-1">If enabled, secondary punches update check-out times instead of failing.</p>
                  </div>
                  <Switch
                    checked={settings.allowMultiplePunches}
                    onCheckedChange={(checked: boolean) => setSettings({ ...settings, allowMultiplePunches: checked })}
                  />
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-slate-900">
                  <div>
                    <Label className="text-xs font-bold text-slate-200">Lazy Auto-Checkout</Label>
                    <p className="text-[10px] text-slate-500 mt-1">Automatically close missing checkouts at target clock hours.</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <Input
                      type="time"
                      value={settings.autoCheckoutTime}
                      disabled={!settings.autoCheckout}
                      onChange={(e) => setSettings({ ...settings, autoCheckoutTime: e.target.value })}
                      className="bg-slate-950 border-slate-900 text-slate-100 font-mono w-28 text-center h-9"
                    />
                    <Switch
                      checked={settings.autoCheckout}
                      onCheckedChange={(checked: boolean) => setSettings({ ...settings, autoCheckout: checked })}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Email Gateway Settings */}
          <Card className="bg-slate-950/40 border-slate-900 rounded-3xl shadow-xl">
            <CardHeader>
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <Mail className="size-4.5 text-blue-500" />
                SMTP Mail Gateway
              </CardTitle>
              <CardDescription className="text-slate-500 text-xs">Manage verification invitations deliveries.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="sm:col-span-2 space-y-2">
                  <Label className="text-slate-300 text-xs font-semibold">SMTP Host Server</Label>
                  <Input
                    value={settings.smtpHost}
                    onChange={(e) => setSettings({ ...settings, smtpHost: e.target.value })}
                    placeholder="smtp.mailgun.org"
                    className="bg-slate-950 border-slate-900 text-slate-100 font-mono"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-slate-300 text-xs font-semibold">Port</Label>
                  <Input
                    type="number"
                    value={settings.smtpPort}
                    onChange={(e) => setSettings({ ...settings, smtpPort: parseInt(e.target.value) || 587 })}
                    className="bg-slate-950 border-slate-900 text-slate-100"
                  />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label className="text-slate-300 text-xs font-semibold">SMTP Username</Label>
                  <Input
                    value={settings.smtpUser}
                    onChange={(e) => setSettings({ ...settings, smtpUser: e.target.value })}
                    className="bg-slate-950 border-slate-900 text-slate-100"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-slate-300 text-xs font-semibold">SMTP Password</Label>
                  <Input
                    type="password"
                    value={settings.smtpPass}
                    onChange={(e) => setSettings({ ...settings, smtpPass: e.target.value })}
                    className="bg-slate-950 border-slate-900 text-slate-100"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-slate-300 text-xs font-semibold">Sender From Email Address</Label>
                <Input
                  type="email"
                  value={settings.smtpFromEmail}
                  onChange={(e) => setSettings({ ...settings, smtpFromEmail: e.target.value })}
                  placeholder="no-reply@aura-attendance.com"
                  className="bg-slate-950 border-slate-900 text-slate-100"
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Side Cards */}
        <div className="space-y-6">
          {/* Notifications Alerts Gateways */}
          <Card className="bg-slate-950/40 border-slate-900 rounded-3xl shadow-xl">
            <CardHeader>
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <Phone className="size-4.5 text-blue-500" />
                Alerts Notifications Gateways
              </CardTitle>
              <CardDescription className="text-slate-500 text-xs">Future roadmap configurations.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-xs font-bold text-slate-200">WhatsApp Dispatcher</Label>
                  <p className="text-[9px] text-slate-500 mt-1">Alert staff on check-in success.</p>
                </div>
                <Switch
                  checked={settings.whatsappEnabled}
                  onCheckedChange={(checked: boolean) => setSettings({ ...settings, whatsappEnabled: checked })}
                />
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-slate-900">
                <div>
                  <Label className="text-xs font-bold text-slate-200">SMS Gateway alerts</Label>
                  <p className="text-[9px] text-slate-500 mt-1">Twilio fallback notifications.</p>
                </div>
                <Switch
                  checked={settings.smsEnabled}
                  onCheckedChange={(checked: boolean) => setSettings({ ...settings, smsEnabled: checked })}
                />
              </div>
            </CardContent>
          </Card>

          {/* API Keys Generator */}
          <Card className="bg-slate-950/40 border-slate-900 rounded-3xl shadow-xl">
            <CardHeader>
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <Key className="size-4.5 text-blue-500" />
                Developer Access Tokens
              </CardTitle>
              <CardDescription className="text-slate-500 text-xs">For custom integrations and webhooks.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {apiKey ? (
                <div className="space-y-2">
                  <Label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Live API Key Token</Label>
                  <div className="p-3 bg-slate-950 border border-slate-900 rounded-2xl break-all font-mono text-xs text-blue-400 font-bold select-all">
                    {apiKey}
                  </div>
                  <p className="text-[9px] text-amber-500 flex items-center gap-1">
                    <ShieldAlert className="size-3 shrink-0" />
                    Copy this key now. It won&apos;t be displayed again.
                  </p>
                </div>
              ) : (
                <p className="text-slate-500 text-xs">No active credentials generated.</p>
              )}
              <Button onClick={generateApiKey} variant="outline" className="w-full border-slate-900 hover:bg-slate-900/50 h-10 rounded-xl text-xs font-semibold">
                Generate API Key Credentials
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
