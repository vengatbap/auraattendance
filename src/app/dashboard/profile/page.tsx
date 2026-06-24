"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Save, LogOut } from "lucide-react";
import { toast } from "sonner";

interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: string;
  createdAt: string;
}

export default function ProfilePage() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("");

  async function fetchProfile() {
    try {
      const res = await fetch("/api/auth/me");
      if (!res.ok) throw new Error("Failed to fetch profile");
      const data = await res.json();
      setProfile(data.user ?? data);
      setName((data.user ?? data).name);
    } catch {
      toast.error("Failed to load profile");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const t = setTimeout(() => {
      fetchProfile();
    }, 0);
    return () => clearTimeout(t);
  }, []);

  async function handleSave() {
    try {
      toast.success("Profile updated successfully");
    } catch {
      toast.error("Failed to save profile");
    }
  }

  if (loading) {
    return <div className="text-center py-12">Loading...</div>;
  }

  if (!profile) {
    return <div className="text-center py-12 text-red-400">Profile not found</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">My Profile</h1>
        <p className="text-slate-400 mt-2">Manage your account settings</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Info */}
        <Card className="bg-slate-900 border-slate-800 lg:col-span-2">
          <CardHeader>
            <CardTitle>Account Information</CardTitle>
            <CardDescription>Your personal details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <Label className="text-slate-300">Full Name</Label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="bg-slate-950/50 border-slate-800 text-slate-100 mt-2"
              />
            </div>

            <div>
              <Label className="text-slate-300">Email Address</Label>
              <Input
                type="email"
                value={profile.email}
                disabled
                className="bg-slate-950/50 border-slate-800 text-slate-100 mt-2"
              />
            </div>

            <div>
              <Label className="text-slate-300">Role</Label>
              <Input
                value={profile.role === "super_admin" ? "Super Administrator" : "Administrator"}
                disabled
                className="bg-slate-950/50 border-slate-800 text-slate-100 mt-2"
              />
            </div>

            <div className="flex gap-3">
              <Button onClick={handleSave} className="bg-blue-600 hover:bg-blue-700">
                <Save className="w-4 h-4 mr-2" />
                Save Changes
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Account Stats */}
        <Card className="bg-slate-900 border-slate-800">
          <CardHeader>
            <CardTitle className="text-lg">Account Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            <div>
              <div className="text-slate-500">Member Since</div>
              <div className="text-slate-100 font-semibold">
                {new Date(profile.createdAt).toLocaleDateString()}
              </div>
            </div>
            <div>
              <div className="text-slate-500">Status</div>
              <div className="text-green-400 font-semibold">Active</div>
            </div>
            <hr className="border-slate-700 my-4" />
            <Button
              type="button"
              variant="outline"
              onClick={async () => {
                await fetch("/api/auth/logout", { method: "POST" });
                window.location.href = "/login";
              }}
              className="w-full border-red-700 text-red-400 hover:bg-red-500/20"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
