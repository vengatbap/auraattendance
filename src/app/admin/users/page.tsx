"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Loader, Search, RefreshCw } from "lucide-react";

interface UserRecord {
  id: string;
  name: string;
  email: string;
  role: string;
  createdAt: string;
  organizationName: string | null;
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  async function fetchUsers() {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/users");
      if (!res.ok) throw new Error();
      const data = await res.json();
      setUsers(data);
    } catch {
      toast.error("Failed to load users list");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchUsers();
  }, []);

  const filteredUsers = users.filter((u) =>
    [u.name, u.email, u.role, u.organizationName || "Platform"].some((val) =>
      val.toLowerCase().includes(searchTerm.toLowerCase())
    )
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-white">Users Master List</h1>
          <p className="text-zinc-500 mt-1 text-sm">Directory of all portal administrators across the platform.</p>
        </div>
        <Button
          onClick={fetchUsers}
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
            placeholder="Search name, email, tenant, or role..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-zinc-950/50 border border-zinc-900 focus:border-zinc-800 rounded-xl pl-9 pr-4 py-2.5 text-xs text-zinc-200 outline-none placeholder:text-zinc-700"
          />
        </div>
      </div>

      <Card className="bg-[#0e0e11] border-zinc-900 rounded-2xl shadow-md">
        <CardHeader>
          <CardTitle className="text-sm font-bold text-white">Platform Administrators</CardTitle>
          <CardDescription className="text-xs text-zinc-500">Total users found: {filteredUsers.length}</CardDescription>
        </CardHeader>
        <CardContent className="p-0 border-t border-zinc-900">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader className="w-6 h-6 animate-spin text-amber-500" />
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="text-center py-12 text-zinc-600 text-xs font-semibold">No users found</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-zinc-950/40 text-[10px] font-black text-zinc-500 uppercase tracking-wider border-b border-zinc-900">
                  <tr>
                    <th className="py-3 px-6">Name</th>
                    <th className="py-3 px-6">Email Address</th>
                    <th className="py-3 px-6">Associated Tenant</th>
                    <th className="py-3 px-6">User Role</th>
                    <th className="py-3 px-6 text-right">Created Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-900">
                  {filteredUsers.map((u) => (
                    <tr key={u.id} className="hover:bg-zinc-950/20 transition-colors">
                      <td className="py-4 px-6 font-bold text-zinc-200">{u.name}</td>
                      <td className="py-4 px-6 text-zinc-400 font-mono">{u.email}</td>
                      <td className="py-4 px-6">
                        {u.organizationName ? (
                          <div className="font-semibold text-zinc-300">{u.organizationName}</div>
                        ) : (
                          <div className="text-zinc-600 italic">Global Platform</div>
                        )}
                      </td>
                      <td className="py-4 px-6">
                        <span
                          className={`inline-flex px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider ${
                            u.role === "super_admin"
                              ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                              : u.role === "admin"
                              ? "bg-blue-500/10 text-blue-400 border border-blue-500/20"
                              : u.role === "manager"
                              ? "bg-purple-500/10 text-purple-400 border border-purple-500/20"
                              : "bg-zinc-800 text-zinc-400 border border-zinc-700"
                          }`}
                        >
                          {u.role}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-right text-zinc-500">
                        {new Date(u.createdAt).toLocaleDateString()}
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
