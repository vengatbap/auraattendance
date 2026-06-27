"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Plus, Edit, Trash2, Network, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { SkeletonTable } from "@/components/ui/skeletons";
import { EmptyState } from "@/components/ui/empty-state";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Department {
  id: string;
  name: string;
  status: string;
  createdAt: string;
}

export default function DepartmentsPage() {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);

  // Form State
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [status, setStatus] = useState<"active" | "inactive">("active");
  const [submitting, setSubmitting] = useState(false);

  async function fetchDepartments() {
    try {
      const res = await fetch("/api/departments");
      if (!res.ok) throw new Error();
      const result = await res.json();
      if (result.success && Array.isArray(result.data)) {
        setDepartments(result.data);
      } else {
        throw new Error();
      }
    } catch {
      toast.error("Failed to load departments");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const t = setTimeout(() => {
      void fetchDepartments();
    }, 0);
    return () => clearTimeout(t);
  }, []);

  const openCreateForm = () => {
    setEditingId(null);
    setName("");
    setStatus("active");
    setFormOpen(true);
  };

  const openEditForm = (dept: Department) => {
    setEditingId(dept.id);
    setName(dept.name);
    setStatus(dept.status as "active" | "inactive");
    setFormOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim().length < 2) {
      toast.error("Department name must be at least 2 characters");
      return;
    }

    setSubmitting(true);
    try {
      const url = editingId ? `/api/departments/${editingId}` : "/api/departments";
      const method = editingId ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, status }),
      });

      const result = await res.json();
      if (!res.ok || !result.success) throw new Error(result.message || "Failed to save department");

      toast.success(editingId ? "Department updated successfully" : "Department created successfully");
      setFormOpen(false);
      void fetchDepartments();
    } catch (err: unknown) {
      const error = err as Error;
      toast.error(error.message || "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  };

  const deleteDepartment = async (id: string) => {
    if (!confirm("Are you sure you want to delete this department? Employees belonging to this department will be unassigned.")) return;

    try {
      const res = await fetch(`/api/departments/${id}`, { method: "DELETE" });
      const result = await res.json();
      if (!res.ok || !result.success) throw new Error();
      setDepartments(departments.filter((d) => d.id !== id));
      toast.success("Department deleted successfully");
    } catch {
      toast.error("Failed to delete department");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Departments</h1>
          <p className="text-slate-400 mt-2">Manage employee segments and organization divisions</p>
        </div>
        {!formOpen && (
          <Button onClick={openCreateForm} className="bg-blue-600 hover:bg-blue-700">
            <Plus className="w-4 h-4 mr-2" />
            Add Department
          </Button>
        )}
      </div>

      {formOpen && (
        <Card className="bg-slate-950/40 border-slate-900 max-w-xl rounded-2xl shadow-xl animate-scale-up">
          <CardHeader>
            <CardTitle className="text-lg font-bold">
              {editingId ? "Edit Department details" : "Create New Department"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-400">Department Name</label>
                <Input
                  placeholder="e.g. Engineering, Sales"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="bg-slate-950 border-slate-900 text-slate-100"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-400">Status</label>
                <Select
                  value={status}
                  onValueChange={(val) => { if (val) setStatus(val); }}
                >
                  <SelectTrigger className="bg-slate-950 border-slate-900 text-slate-100">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-900 border-slate-800">
                    <SelectItem value="active" className="text-slate-100">Active</SelectItem>
                    <SelectItem value="inactive" className="text-slate-100">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex gap-3 pt-2 border-t border-slate-900">
                <Button type="submit" disabled={submitting} className="bg-blue-600 hover:bg-blue-500 font-bold">
                  {submitting && <Loader2 className="size-4 animate-spin mr-2" />}
                  {editingId ? "Save Changes" : "Create Department"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setFormOpen(false)}
                  className="border-slate-800 text-slate-300"
                >
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {loading ? (
        <SkeletonTable rows={4} cols={3} />
      ) : departments.length === 0 ? (
        <EmptyState
          title="No Departments Yet"
          description="Group your workforce into organizational divisions for easier site logs management."
          icon={Network}
          action={
            <Button onClick={openCreateForm} className="bg-blue-600 hover:bg-blue-700">
              <Plus className="w-4 h-4 mr-2" />
              Add First Department
            </Button>
          }
        />
      ) : (
        <div className="border border-slate-900 bg-slate-950/20 rounded-2xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-950 border-b border-slate-900 text-xs font-semibold text-slate-400 uppercase">
                <tr>
                  <th className="p-4">Department Name</th>
                  <th className="p-4">Status</th>
                  <th className="p-4">Created Date</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-900">
                {departments.map((dept) => (
                  <tr key={dept.id} className="hover:bg-slate-900/20 transition-colors">
                    <td className="p-4 font-bold text-slate-200">{dept.name}</td>
                    <td className="p-4">
                      <span
                        className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider ${
                          dept.status === "active"
                            ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                            : "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                        }`}
                      >
                        {dept.status}
                      </span>
                    </td>
                    <td className="p-4 text-slate-400 text-xs">
                      {new Date(dept.createdAt).toLocaleDateString(undefined, {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })}
                    </td>
                    <td className="p-4 text-right space-x-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openEditForm(dept)}
                        className="text-blue-500 hover:bg-blue-600/10"
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteDepartment(dept.id)}
                        className="text-red-500 hover:bg-red-600/10"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
