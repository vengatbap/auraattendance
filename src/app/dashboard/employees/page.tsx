"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Camera, Edit, Loader, Plus, Search, UserX } from "lucide-react";
import { toast } from "sonner";

interface Employee {
  id: string;
  employeeNumber: string;
  name: string;
  status: string;
  cpr: string;
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

      if (!employeesRes.ok) throw new Error("Failed to fetch employees");
      if (!sitesRes.ok) throw new Error("Failed to fetch sites");

      setEmployees(await employeesRes.json());
      setSites(await sitesRes.json());
    } catch {
      toast.error("Failed to load employees");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const t = setTimeout(() => {
      fetchEmployees();
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
      return [employee.employeeNumber, employee.name, employee.cpr, siteName, employee.status]
        .some((value) => value.toLowerCase().includes(search));
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
      if (!res.ok) throw new Error("Failed to disable employee");

      const updated = await res.json();
      setEmployees((current) => current.map((employee) => employee.id === id ? updated : employee));
      toast.success("Employee disabled");
    } catch {
      toast.error("Failed to disable employee");
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold">Employees</h1>
          <p className="text-slate-400 mt-2">List, search, enroll, edit, register face, and disable employees</p>
        </div>
        <Link href="/dashboard/employees/new">
          <Button className="bg-blue-600 hover:bg-blue-700">
            <Plus className="w-4 h-4 mr-2" />
            Add Employee
          </Button>
        </Link>
      </div>

      <Card className="bg-slate-900 border-slate-800">
        <CardHeader>
          <CardTitle>All Employees</CardTitle>
          <CardDescription>Total: {filteredEmployees.length}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="relative max-w-xl">
            <Search className="absolute left-3 top-3 w-4 h-4 text-slate-500" />
            <Input
              placeholder="Search name, employee ID, government ID, site, or status"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              className="pl-10 bg-slate-950/50 border-slate-800 text-slate-100"
            />
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader className="w-6 h-6 animate-spin text-blue-600" />
            </div>
          ) : filteredEmployees.length === 0 ? (
            <div className="text-center py-8 text-slate-400">No employees found</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b border-slate-700">
                  <tr>
                    <th className="text-left py-3 px-4 font-semibold">Employee ID</th>
                    <th className="text-left py-3 px-4 font-semibold">Name</th>
                    <th className="text-left py-3 px-4 font-semibold">Government ID</th>
                    <th className="text-left py-3 px-4 font-semibold">Site</th>
                    <th className="text-left py-3 px-4 font-semibold">Status</th>
                    <th className="text-left py-3 px-4 font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredEmployees.map((employee) => (
                    <tr key={employee.id} className="border-b border-slate-800 hover:bg-slate-800/50">
                      <td className="py-3 px-4 font-mono text-slate-400">{employee.employeeNumber}</td>
                      <td className="py-3 px-4">{employee.name}</td>
                      <td className="py-3 px-4 text-slate-400">{employee.cpr}</td>
                      <td className="py-3 px-4 text-slate-400">
                        {employee.siteId ? siteById.get(employee.siteId) ?? "Unknown site" : "-"}
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`px-2 py-1 rounded text-xs font-semibold ${
                            employee.status === "active"
                              ? "bg-green-500/20 text-green-400"
                              : employee.status === "inactive"
                              ? "bg-yellow-500/20 text-yellow-400"
                              : "bg-red-500/20 text-red-400"
                          }`}
                        >
                          {employee.status}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex gap-2">
                          <Link href={`/dashboard/employees/${employee.id}/edit`}>
                            <Button variant="ghost" size="sm" className="text-blue-400 hover:bg-blue-500/20">
                              <Edit className="w-4 h-4" />
                            </Button>
                          </Link>
                          <Link href={`/dashboard/employees/${employee.id}/face`}>
                            <Button variant="ghost" size="sm" className="text-emerald-400 hover:bg-emerald-500/20">
                              <Camera className="w-4 h-4" />
                            </Button>
                          </Link>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-red-400 hover:bg-red-500/20"
                            onClick={() => disableEmployee(employee.id)}
                            disabled={employee.status === "inactive"}
                          >
                            <UserX className="w-4 h-4" />
                          </Button>
                        </div>
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
