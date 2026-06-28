"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Camera, Edit, Plus, Search, UserX, Users } from "lucide-react";
import { toast } from "sonner";
import { SkeletonTable } from "@/components/ui/skeletons";
import { EmptyState } from "@/components/ui/empty-state";

interface Employee {
  id: string;
  employeeCode: string;
  name: string;
  status: string;
  governmentId: string;
  siteId: string | null;
}

interface Site {
  id: string;
  name: string;
}

export default function EmployeesPage() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [sites, setSites] = useState<Site[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  async function fetchEmployees() {
    try {
      const [employeesRes, sitesRes] = await Promise.all([
        fetch("/api/employees"),
        fetch("/api/sites"),
      ]);

      if (!employeesRes.ok || !sitesRes.ok) throw new Error();

      const empResult = await employeesRes.json();
      const siteResult = await sitesRes.json();

      if (empResult.success && siteResult.success) {
        setEmployees(empResult.data || []);
        setSites(siteResult.data || []);
      } else {
        throw new Error();
      }
    } catch {
      toast.error("Failed to load employees data");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const t = setTimeout(() => {
      void fetchEmployees();
    }, 0);
    return () => clearTimeout(t);
  }, []);

  const siteById = useMemo(() => {
    return new Map(sites.map((site) => [site.id, site.name]));
  }, [sites]);

  const filteredEmployees = useMemo(() => {
    const search = searchTerm.trim().toLowerCase();
    if (!search) return employees;

    return employees.filter((employee) => {
      const siteName = employee.siteId ? siteById.get(employee.siteId) ?? "" : "";
      return [
        employee.employeeCode || "",
        employee.name || "",
        employee.governmentId || "",
        siteName,
        employee.status || "",
      ].some((value) => value.toLowerCase().includes(search));
    });
  }, [employees, searchTerm, siteById]);

  async function disableEmployee(id: string) {
    if (!confirm("Disable this employee? They will no longer be able to punch attendance.")) return;

    try {
      const res = await fetch(`/api/employees/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "inactive" }),
      });
      const result = await res.json();
      if (!res.ok || !result.success) throw new Error();

      toast.success("Employee deactivated successfully");
      void fetchEmployees();
    } catch {
      toast.error("Failed to disable employee");
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold">Employees</h1>
          <p className="text-slate-400 mt-2">Manage employee records, design designations, and register biometrics</p>
        </div>
        <Link href="/dashboard/employees/new">
          <Button className="bg-blue-600 hover:bg-blue-700">
            <Plus className="w-4 h-4 mr-2" />
            Add Employee
          </Button>
        </Link>
      </div>

      <Card className="bg-slate-950/40 border-slate-900 rounded-3xl shadow-xl">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg">Staff Records</CardTitle>
          <CardDescription className="text-slate-400 text-xs">Total registered active staff: {filteredEmployees.length}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="relative max-w-xl">
            <Search className="absolute left-3 top-3 w-4 h-4 text-slate-500" />
            <Input
              placeholder="Search name, code, government ID, site, or status..."
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              className="pl-10 bg-slate-950 border-slate-900 text-slate-100 placeholder:text-slate-700"
            />
          </div>

          {loading ? (
            <SkeletonTable rows={5} cols={5} />
          ) : filteredEmployees.length === 0 ? (
            <EmptyState
              title="No Employees Found"
              description="Register your first employee profile and initiate biometric face capturing to test checking in."
              icon={Users}
              action={
                <Link href="/dashboard/employees/new">
                  <Button className="bg-blue-600 hover:bg-blue-700">
                    <Plus className="w-4 h-4 mr-2" />
                    Register Employee
                  </Button>
                </Link>
              }
            />
          ) : (
            <div className="border border-slate-900 rounded-2xl overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-950 border-b border-slate-900 text-xs font-semibold text-slate-400 uppercase">
                    <tr>
                      <th className="py-3.5 px-4">Employee Code</th>
                      <th className="py-3.5 px-4">Name</th>
                      <th className="py-3.5 px-4">Government ID</th>
                      <th className="py-3.5 px-4">Registered Site</th>
                      <th className="py-3.5 px-4">Status</th>
                      <th className="py-3.5 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-900">
                    {filteredEmployees.map((employee) => (
                      <tr key={employee.id} className="hover:bg-slate-900/20 transition-colors">
                        <td className="py-3.5 px-4 font-mono font-bold text-slate-400 text-xs">{employee.employeeCode}</td>
                        <td className="py-3.5 px-4 font-semibold text-slate-200">{employee.name}</td>
                        <td className="py-3.5 px-4 text-slate-400 text-xs">{employee.governmentId}</td>
                        <td className="py-3.5 px-4 text-slate-400 text-xs">
                          {employee.siteId ? siteById.get(employee.siteId) ?? "Unknown site" : "-"}
                        </td>
                        <td className="py-3.5 px-4">
                          <span
                            className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider ${
                              employee.status === "active"
                                ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                                : employee.status === "inactive"
                                ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                                : "bg-red-500/10 text-red-400 border border-red-500/20"
                            }`}
                          >
                            {employee.status}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-right space-x-1">
                          <Link href={`/dashboard/employees/${employee.id}/edit`}>
                            <Button variant="ghost" size="sm" className="text-blue-500 hover:bg-blue-600/10">
                              <Edit className="w-4 h-4" />
                            </Button>
                          </Link>
                          <Link href={`/dashboard/employees/${employee.id}/face`}>
                            <Button variant="ghost" size="sm" className="text-emerald-500 hover:bg-emerald-600/10">
                              <Camera className="w-4 h-4" />
                            </Button>
                          </Link>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-red-500 hover:bg-red-600/10"
                            onClick={() => disableEmployee(employee.id)}
                            disabled={employee.status === "inactive" || employee.status === "resigned"}
                          >
                            <UserX className="w-4 h-4" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
