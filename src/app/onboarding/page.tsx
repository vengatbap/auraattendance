"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Building2,
  Camera,
  ChevronRight,
  Clock,
  LocateFixed,
  MapPin,
  Sparkles,
  User,
  ArrowRight,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(0); // 0: Welcome, 1: Branding, 2: Timezone, 3: First Site, 4: First Employee, 5: Done
  const [loading, setLoading] = useState(false);


  // Form State
  const [branding, setBranding] = useState({
    logo: "",
    primaryColor: "#2563eb",
    secondaryColor: "#4f46e5",
    companyName: "",
  });

  const [timezone, setTimezone] = useState({
    timezone: "UTC",
    dateFormat: "YYYY-MM-DD",
  });

  const [site, setSite] = useState({
    name: "Headquarters",
    latitude: 0,
    longitude: 0,
    radius: 50,
  });

  const [employee, setEmployee] = useState({
    name: "",
    employeeCode: "",
    governmentId: "",
    designation: "",
    department: "",
  });

  useEffect(() => {
    // Fetch active session on load
    async function checkSession() {
      try {
        const res = await fetch("/api/auth/me");
        if (!res.ok) {
          router.push("/login");
          return;
        }
        const user = (await res.json()) as { name: string; email: string };
        setBranding((b) => ({ ...b, companyName: user.name + "'s Org" }));
      } catch {
        router.push("/login");
      }
    }
    void checkSession();
  }, [router]);

  // Request browser location and auto fill
  const handleGeoFill = () => {
    if (typeof window === "undefined" || !navigator.geolocation) {
      toast.error("Geolocation is not supported by your browser");
      return;
    }
    setLoading(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setSite((s) => ({
          ...s,
          latitude: parseFloat(position.coords.latitude.toFixed(6)),
          longitude: parseFloat(position.coords.longitude.toFixed(6)),
        }));
        toast.success("Coordinates filled successfully!");
        setLoading(false);
      },
      () => {
        toast.error("Permission denied or location lookup failed.");
        setLoading(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const handleNextStep = () => {
    if (step === 1 && !branding.companyName) {
      toast.error("Company Name is required");
      return;
    }
    if (step === 3 && (!site.name || !site.latitude || !site.longitude)) {
      toast.error("All site coordinates are required");
      return;
    }
    if (step === 4 && (!employee.name || !employee.employeeCode || !employee.governmentId)) {
      toast.error("Employee Name, Code, and Government ID are required");
      return;
    }
    setStep((s) => s + 1);
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      setBranding((b) => ({ ...b, logo: reader.result as string }));
    };
    reader.readAsDataURL(file);
  };

  const handleOnboardingSubmit = async () => {
    setLoading(true);
    try {
      // 1. Update Organization Settings
      const orgRes = await fetch(`/api/settings`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          logo: branding.logo || null,
          primaryColor: branding.primaryColor,
          secondaryColor: branding.secondaryColor,
          companyName: branding.companyName,
          timezone: timezone.timezone,
          dateFormat: timezone.dateFormat,
          isOnboarded: true,
        }),
      });
      if (!orgRes.ok) throw new Error("Failed to update organization settings");

      // 2. Create First Site
      const siteRes = await fetch("/api/sites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: site.name,
          latitude: site.latitude,
          longitude: site.longitude,
          radius: site.radius,
          status: "active",
        }),
      });
      if (!siteRes.ok) throw new Error("Failed to save first site location");
      const siteResult = await siteRes.json();
      const savedSite = siteResult.data;

      // 3. Create First Employee
      const empRes = await fetch("/api/employees", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: employee.name,
          employeeCode: employee.employeeCode,
          governmentId: employee.governmentId,
          designation: employee.designation || "Initial Setup Profile",
          department: employee.department || "Operations",
          siteId: savedSite.id,
          status: "active",
        }),
      });
      if (!empRes.ok) throw new Error("Failed to enroll first employee record");
      const empResult = await empRes.json();
      const savedEmployee = empResult.data;

      toast.success("Onboarding configurations saved!");
      
      // Redirect straight to Face Enrollment for the newly created employee
      router.push(`/dashboard/employees/${savedEmployee.id}/face`);
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : "An error occurred during onboarding setup";
      toast.error(errMsg);
    } finally {
      setLoading(false);
    }
  };

  const stepsLength = 5;
  const progressPercent = (step / stepsLength) * 100;

  return (
    <div className="min-h-screen bg-[#030712] text-slate-100 flex flex-col justify-center items-center p-4 font-sans relative overflow-hidden">
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-blue-600/10 blur-[120px] pointer-events-none" />

      {step > 0 && (
        <div className="w-full max-w-lg mb-6 z-10">
          <div className="flex justify-between items-center text-xs font-semibold text-slate-400 mb-2">
            <span>Setup Progress</span>
            <span>{Math.round(progressPercent)}%</span>
          </div>
          <div className="h-2 rounded-full bg-slate-900 border border-slate-800 overflow-hidden">
            <div
              className="h-full rounded-full bg-blue-600 transition-all duration-300"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      )}

      <div className="w-full max-w-lg bg-slate-950/50 border border-slate-900 backdrop-blur-xl rounded-3xl shadow-2xl p-8 z-10 min-h-[440px] flex flex-col justify-between">
        
        {/* Step 0: Welcome Screen */}
        {step === 0 && (
          <div className="space-y-6">
            <div className="size-16 rounded-2xl bg-blue-600/15 border border-blue-500/20 text-blue-500 flex items-center justify-center">
              <Sparkles className="size-8 animate-pulse" />
            </div>
            <div className="space-y-2">
              <h1 className="text-3xl font-extrabold text-white tracking-tight">Welcome to Aura</h1>
              <p className="text-slate-400 text-sm leading-relaxed">
                Let&apos;s customize your workspace. In under two minutes, we will set up your branding, geofence site, and register your first employee.
              </p>
            </div>
            <div className="p-4 rounded-2xl bg-slate-900/30 border border-slate-900 space-y-3">
              {[
                "Confirm company details & colors",
                "Set timezone rules",
                "Create your check-in site",
                "Register the first employee face",
              ].map((info, idx) => (
                <div key={idx} className="flex items-center gap-3 text-xs text-slate-300">
                  <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-blue-600/15 text-[10px] font-bold text-blue-400">
                    {idx + 1}
                  </span>
                  {info}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Step 1: Branding Setup */}
        {step === 1 && (
          <div className="space-y-6">
            <div className="flex items-center gap-3 border-b border-slate-900 pb-4">
              <Building2 className="size-5 text-blue-500" />
              <h2 className="text-xl font-bold text-white">Company Branding</h2>
            </div>
            <div className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-400">Company Name</label>
                <Input
                  value={branding.companyName}
                  onChange={(e) => setBranding({ ...branding, companyName: e.target.value })}
                  className="bg-slate-950 border-slate-900 text-slate-100"
                />
              </div>

              <div className="grid sm:grid-cols-2 gap-4 items-center">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-400">Company Logo</label>
                  <div className="flex items-center gap-3">
                    {branding.logo ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={branding.logo} alt="Company logo preview" className="size-11 rounded-lg object-cover border border-slate-800" />
                    ) : (
                      <div className="size-11 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-600">
                        <Camera className="size-5" />
                      </div>
                    )}
                    <label className="text-xs text-blue-500 font-semibold cursor-pointer hover:underline">
                      Upload Logo
                      <input type="file" onChange={handleLogoUpload} accept="image/*" className="hidden" />
                    </label>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-400">Theme Color</label>
                  <div className="flex gap-2">
                    <Input
                      type="color"
                      value={branding.primaryColor}
                      onChange={(e) => setBranding({ ...branding, primaryColor: e.target.value })}
                      className="w-12 h-10 p-0 border border-slate-800 bg-transparent rounded-lg cursor-pointer"
                    />
                    <Input
                      value={branding.primaryColor}
                      onChange={(e) => setBranding({ ...branding, primaryColor: e.target.value })}
                      className="bg-slate-950 border-slate-900 text-slate-100 font-mono text-xs"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Timezone Setup */}
        {step === 2 && (
          <div className="space-y-6">
            <div className="flex items-center gap-3 border-b border-slate-900 pb-4">
              <Clock className="size-5 text-blue-500" />
              <h2 className="text-xl font-bold text-white">Localization Settings</h2>
            </div>
            <div className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-400">Workspace Timezone</label>
                <select
                  value={timezone.timezone}
                  onChange={(e) => setTimezone({ ...timezone, timezone: e.target.value })}
                  className="w-full h-11 px-3 rounded-lg bg-slate-950 border border-slate-900 text-slate-300 text-sm focus:outline-none focus:border-blue-600 transition"
                >
                  <option value="UTC">Coordinated Universal Time (UTC)</option>
                  <option value="Asia/Bahrain">Manama, Bahrain (GMT+3)</option>
                  <option value="Asia/Riyadh">Riyadh, Saudi Arabia (GMT+3)</option>
                  <option value="Asia/Dubai">Dubai, UAE (GMT+4)</option>
                  <option value="Europe/London">London, UK (GMT+0/1)</option>
                  <option value="America/New_York">New York, USA (GMT-5/4)</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-400">Preferred Date Format</label>
                <select
                  value={timezone.dateFormat}
                  onChange={(e) => setTimezone({ ...timezone, dateFormat: e.target.value })}
                  className="w-full h-11 px-3 rounded-lg bg-slate-950 border border-slate-900 text-slate-300 text-sm focus:outline-none focus:border-blue-600 transition"
                >
                  <option value="YYYY-MM-DD">YYYY-MM-DD (2026-06-27)</option>
                  <option value="DD/MM/YYYY">DD/MM/YYYY (27/06/2026)</option>
                  <option value="MM/DD/YYYY">MM/DD/YYYY (06/27/2026)</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* Step 3: First Site Geofence */}
        {step === 3 && (
          <div className="space-y-6">
            <div className="flex items-center gap-3 border-b border-slate-900 pb-4">
              <MapPin className="size-5 text-blue-500" />
              <h2 className="text-xl font-bold text-white">Create First Site</h2>
            </div>
            <div className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-400">Site Name</label>
                <Input
                  value={site.name}
                  onChange={(e) => setSite({ ...site, name: e.target.value })}
                  className="bg-slate-950 border-slate-900 text-slate-100"
                />
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-400">Latitude</label>
                  <Input
                    type="number"
                    step="0.000001"
                    value={site.latitude}
                    onChange={(e) => setSite({ ...site, latitude: parseFloat(e.target.value) || 0 })}
                    className="bg-slate-950 border-slate-900 text-slate-100"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-400">Longitude</label>
                  <Input
                    type="number"
                    step="0.000001"
                    value={site.longitude}
                    onChange={(e) => setSite({ ...site, longitude: parseFloat(e.target.value) || 0 })}
                    className="bg-slate-950 border-slate-900 text-slate-100"
                  />
                </div>
              </div>

              <div className="flex gap-4 items-center">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleGeoFill}
                  disabled={loading}
                  className="h-10 text-xs border-slate-800 text-slate-300"
                >
                  <LocateFixed className="size-3.5 mr-2" />
                  Auto-fill coordinates
                </Button>
                <p className="text-[10px] text-slate-500 leading-normal">
                  Grabs your browser location to configure your office geofence instantly.
                </p>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-xs font-semibold">
                  <span className="text-slate-400">Geofence Radius Limit</span>
                  <span className="text-blue-500">{site.radius} meters</span>
                </div>
                <input
                  type="range"
                  min="20"
                  max="500"
                  step="10"
                  value={site.radius}
                  onChange={(e) => setSite({ ...site, radius: parseInt(e.target.value) })}
                  className="w-full accent-blue-600 bg-slate-900 h-1.5 rounded-lg appearance-none cursor-pointer"
                />
              </div>
            </div>
          </div>
        )}

        {/* Step 4: Create First Employee */}
        {step === 4 && (
          <div className="space-y-6">
            <div className="flex items-center gap-3 border-b border-slate-900 pb-4">
              <User className="size-5 text-blue-500" />
              <h2 className="text-xl font-bold text-white">Create First Employee</h2>
            </div>
            <div className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-400">Employee Full Name</label>
                <Input
                  placeholder="Ahmed Ali"
                  value={employee.name}
                  onChange={(e) => setEmployee({ ...employee, name: e.target.value })}
                  className="bg-slate-950 border-slate-900 text-slate-100"
                />
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-400">Employee Code (ID)</label>
                  <Input
                    placeholder="EMP-1001"
                    value={employee.employeeCode}
                    onChange={(e) => setEmployee({ ...employee, employeeCode: e.target.value })}
                    className="bg-slate-950 border-slate-900 text-slate-100"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-400">Government ID</label>
                  <Input
                    placeholder="990123456"
                    value={employee.governmentId}
                    onChange={(e) => setEmployee({ ...employee, governmentId: e.target.value })}
                    className="bg-slate-950 border-slate-900 text-slate-100"
                  />
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-400">Designation (optional)</label>
                  <Input
                    placeholder="General Manager"
                    value={employee.designation}
                    onChange={(e) => setEmployee({ ...employee, designation: e.target.value })}
                    className="bg-slate-950 border-slate-900 text-slate-100"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-400">Department (optional)</label>
                  <Input
                    placeholder="Administration"
                    value={employee.department}
                    onChange={(e) => setEmployee({ ...employee, department: e.target.value })}
                    className="bg-slate-950 border-slate-900 text-slate-100"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Buttons / Actions */}
        <div className="mt-8 flex gap-3 pt-4 border-t border-slate-900">
          {step > 0 && (
            <Button
              variant="outline"
              onClick={() => setStep((s) => s - 1)}
              disabled={loading}
              className="h-12 border-slate-800 text-slate-300"
            >
              Back
            </Button>
          )}

          {step < 4 ? (
            <Button
              onClick={handleNextStep}
              className="h-12 flex-1 bg-blue-600 hover:bg-blue-500 font-bold"
            >
              Continue
              <ChevronRight className="ml-2 size-4" />
            </Button>
          ) : (
            <Button
              onClick={handleOnboardingSubmit}
              disabled={loading}
              className="h-12 flex-1 bg-blue-600 hover:bg-blue-500 font-bold"
            >
              {loading ? (
                <>
                  <Loader2 className="size-4 animate-spin mr-2" />
                  Saving Workspace...
                </>
              ) : (
                <>
                  Enroll Biometrics
                  <ArrowRight className="ml-2 size-4" />
                </>
              )}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
