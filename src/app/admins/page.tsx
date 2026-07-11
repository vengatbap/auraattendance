"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Edit, Trash2, Loader } from "lucide-react";
import { toast } from "sonner";

interface Admin {
  id: string;
  email: string;
  name: string;
  role: string;
  createdAt: string;
}

export default function AdminsPage() {
  const [admins, setAdmins] = useState<Admin[]>([]);
  const [loading, setLoading] = useState(true);

  async function fetchAdmins() {
    try {
      const res = await fetch("/api/admins");
      if (!res.ok) throw new Error("Failed to fetch admins");
      const data = await res.json();
      setAdmins(data);
    } catch {
      toast.error("Failed to load admins");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const t = setTimeout(() => {
      fetchAdmins();
    }, 0);
    return () => clearTimeout(t);
  }, []);

  async function deleteAdmin(id: string) {
    if (!confirm("Are you sure you want to delete this admin?")) return;

    try {
      const res = await fetch(`/api/admins/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete admin");
      setAdmins(admins.filter((a) => a.id !== id));
      toast.success("Admin deleted successfully");
    } catch {
      toast.error("Failed to delete admin");
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Administrators</h1>
          <p className="text-slate-400 mt-2">Manage system administrators</p>
        </div>
        <Link href="/dashboard/admins/new">
          <Button className="bg-blue-600 hover:bg-blue-700">
            <Plus className="w-4 h-4 mr-2" />
            Add Admin
          </Button>
        </Link>
      </div>

      <Card className="bg-slate-900 border-slate-800">
        <CardHeader>
          <CardTitle>All Administrators</CardTitle>
          <CardDescription>Total: {admins.length}</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader className="w-6 h-6 animate-spin text-blue-600" />
            </div>
          ) : admins.length === 0 ? (
            <div className="text-center py-8 text-slate-400">No administrators found</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b border-slate-700">
                  <tr>
                    <th className="text-left py-3 px-4 font-semibold">Name</th>
                    <th className="text-left py-3 px-4 font-semibold">Email</th>
                    <th className="text-left py-3 px-4 font-semibold">Role</th>
                    <th className="text-left py-3 px-4 font-semibold">Created</th>
                    <th className="text-left py-3 px-4 font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {admins.map((admin) => (
                    <tr key={admin.id} className="border-b border-slate-800 hover:bg-slate-800/50">
                      <td className="py-3 px-4">{admin.name}</td>
                      <td className="py-3 px-4 text-slate-400">{admin.email}</td>
                      <td className="py-3 px-4">
                        <span
                          className={`px-2 py-1 rounded text-xs font-semibold ${
                            admin.role === "admin"
                              ? "bg-blue-500/20 text-blue-400"
                              : admin.role === "manager"
                              ? "bg-purple-500/20 text-purple-400"
                              : "bg-slate-500/20 text-slate-400"
                          }`}
                        >
                          {admin.role === "admin"
                            ? "Admin"
                            : admin.role === "manager"
                            ? "Manager"
                            : "Viewer"}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-400">
                        {new Date(admin.createdAt).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-4 flex gap-2">
                        <Link href={`/dashboard/admins/${admin.id}/edit`}>
                          <Button variant="ghost" size="sm" className="text-blue-400 hover:bg-blue-500/20">
                            <Edit className="w-4 h-4" />
                          </Button>
                        </Link>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-red-400 hover:bg-red-500/20"
                          onClick={() => deleteAdmin(admin.id)}
                        >
                          <Trash2 className="w-4 h-4" />
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
