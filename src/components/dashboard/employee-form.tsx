"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Camera } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

const employeeSchema = z.object({
  employeeCode: z.string().min(1, "Employee Code is required").max(100),
  governmentId: z.string().min(1, "Government ID number is required").max(100),
  name: z.string().min(2, "Employee name must be at least 2 characters").max(255),
  siteId: z.string().min(1, "Site is required"),
  departmentId: z.string().optional().nullable(),
  designation: z.string().max(255).optional().nullable(),
  phone: z.string().max(50).optional().nullable(),
  email: z.string().email("Invalid email address").or(z.literal("")).optional().nullable(),
  status: z.enum(["active", "inactive", "suspended", "resigned"]),
});

type EmployeeFormData = z.infer<typeof employeeSchema>;

interface SiteOption {
  id: string;
  name: string;
  status: string;
}

interface DepartmentOption {
  id: string;
  name: string;
  status: string;
}

interface EmployeeFormProps {
  initialData?: Partial<EmployeeFormData> & { id?: string };
  isEdit?: boolean;
}

export function EmployeeForm({ initialData, isEdit }: EmployeeFormProps) {
  const router = useRouter();
  const [sites, setSites] = useState<SiteOption[]>([]);
  const [departments, setDepartments] = useState<DepartmentOption[]>([]);

  const form = useForm<EmployeeFormData>({
    resolver: zodResolver(employeeSchema),
    defaultValues: {
      employeeCode: initialData?.employeeCode || "",
      governmentId: initialData?.governmentId || "",
      name: initialData?.name || "",
      siteId: initialData?.siteId || "",
      departmentId: initialData?.departmentId || "",
      designation: initialData?.designation || "",
      phone: initialData?.phone || "",
      email: initialData?.email || "",
      status: initialData?.status || "active",
    },
  });

  useEffect(() => {
    async function fetchData() {
      try {
        const [sitesRes, deptsRes] = await Promise.all([
          fetch("/api/sites"),
          fetch("/api/departments"),
        ]);

        if (sitesRes.ok) {
          const siteResult = await sitesRes.json();
          setSites((siteResult.data || []).filter((site: SiteOption) => site.status === "active"));
        }
        if (deptsRes.ok) {
          const deptResult = await deptsRes.json();
          setDepartments((deptResult.data || []).filter((dept: DepartmentOption) => dept.status === "active"));
        }
      } catch {
        toast.error("Failed to load options");
      }
    }

    void fetchData();
  }, []);

  async function onSubmit(values: EmployeeFormData) {
    try {
      const url = isEdit ? `/api/employees/${initialData?.id}` : "/api/employees";
      const method = isEdit ? "PUT" : "POST";

      const cleanedValues = {
        ...values,
        email: values.email || null,
        departmentId: values.departmentId || null,
        designation: values.designation || null,
        phone: values.phone || null,
      };

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(cleanedValues),
      });

      const result = await res.json();
      if (!res.ok || !result.success) {
        throw new Error(result.message || "Failed to save employee");
      }

      const savedEmployee = result.data;
      toast.success(isEdit ? "Employee updated successfully" : "Employee created successfully");

      if (isEdit) {
        router.push("/dashboard/employees");
      } else {
        router.push(`/dashboard/employees/${savedEmployee.id}/face`);
      }
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "An error occurred");
    }
  }

  return (
    <Card className="bg-slate-950/40 border-slate-900 max-w-2xl rounded-3xl shadow-xl">
      <CardHeader>
        <CardTitle className="text-xl font-bold">{isEdit ? "Edit Employee Details" : "Enroll New Employee"}</CardTitle>
        <CardDescription className="text-slate-400 text-xs">
          {isEdit ? "Update employee profile details." : "Add employee profile to trigger biometric capturing."}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-slate-300">Employee Full Name *</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Ahmed Ali"
                      {...field}
                      className="bg-slate-950 border-slate-900 text-slate-100 placeholder:text-slate-700"
                    />
                  </FormControl>
                  <FormMessage className="text-red-400" />
                </FormItem>
              )}
            />

            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="employeeCode"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-slate-300">Employee Code (ID) *</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="EMP-1001"
                        {...field}
                        disabled={isEdit}
                        className="bg-slate-950 border-slate-900 text-slate-100 disabled:opacity-60"
                      />
                    </FormControl>
                    <FormMessage className="text-red-400" />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="governmentId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-slate-300">Government ID Number *</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="e.g. 990123456"
                        {...field}
                        disabled={isEdit}
                        className="bg-slate-950 border-slate-900 text-slate-100 disabled:opacity-60"
                      />
                    </FormControl>
                    <FormMessage className="text-red-400" />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="siteId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-slate-300">Site Assignment *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger className="bg-slate-950 border-slate-900 text-slate-100">
                          <SelectValue placeholder="Select location site" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="bg-slate-900 border-slate-900">
                        {sites.map((site) => (
                          <SelectItem key={site.id} value={site.id} className="text-slate-100">
                            {site.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage className="text-red-400" />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="departmentId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-slate-300">Department</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value || ""}
                    >
                      <FormControl>
                        <SelectTrigger className="bg-slate-950 border-slate-900 text-slate-100">
                          <SelectValue placeholder="Select department (optional)" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="bg-slate-900 border-slate-900">
                        <SelectItem value="none" className="text-slate-500 italic">None</SelectItem>
                        {departments.map((dept) => (
                          <SelectItem key={dept.id} value={dept.id} className="text-slate-100">
                            {dept.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage className="text-red-400" />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="designation"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-slate-300">Designation (Job Title)</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="e.g. Senior Analyst"
                        {...field}
                        value={field.value || ""}
                        className="bg-slate-950 border-slate-900 text-slate-100 placeholder:text-slate-700"
                      />
                    </FormControl>
                    <FormMessage className="text-red-400" />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-slate-300">Phone Number</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="+373..."
                        {...field}
                        value={field.value || ""}
                        className="bg-slate-950 border-slate-900 text-slate-100 placeholder:text-slate-700"
                      />
                    </FormControl>
                    <FormMessage className="text-red-400" />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-slate-300">Email Address</FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        placeholder="example@aura.com"
                        {...field}
                        value={field.value || ""}
                        className="bg-slate-950 border-slate-900 text-slate-100 placeholder:text-slate-700"
                      />
                    </FormControl>
                    <FormMessage className="text-red-400" />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-slate-300">Status</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger className="bg-slate-950 border-slate-900 text-slate-100">
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="bg-slate-900 border-slate-900">
                        <SelectItem value="active" className="text-slate-100">Active</SelectItem>
                        <SelectItem value="inactive" className="text-slate-100">Inactive</SelectItem>
                        <SelectItem value="suspended" className="text-slate-100">Suspended</SelectItem>
                        <SelectItem value="resigned" className="text-slate-100">Resigned</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage className="text-red-400" />
                  </FormItem>
                )}
              />
            </div>

            {isEdit && initialData?.id && (
              <div className="pt-2">
                <Link href={`/dashboard/employees/${initialData.id}/face`} className="block">
                  <Button type="button" variant="outline" className="w-full border-slate-800 text-slate-300 h-11">
                    <Camera className="w-4 h-4 mr-2" />
                    Re-enroll Biometric Face Profile
                  </Button>
                </Link>
              </div>
            )}

            <div className="flex gap-4 pt-4 border-t border-slate-900">
              <Button type="submit" className="bg-blue-600 hover:bg-blue-500 font-bold px-6 h-11" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting ? "Saving..." : isEdit ? "Save Profile" : "Save and Capture Face"}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
                className="border-slate-800 text-slate-300 h-11"
              >
                Cancel
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
