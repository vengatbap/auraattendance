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
  employeeNumber: z.string().min(1, "Employee ID is required"),
  cpr: z.string().min(1, "Government ID number is required"),
  name: z.string().min(2, "Employee name must be at least 2 characters"),
  siteId: z.string().min(1, "Site is required"),
});

type EmployeeFormData = z.infer<typeof employeeSchema>;

interface SiteOption {
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
  const form = useForm<EmployeeFormData>({
    resolver: zodResolver(employeeSchema),
    defaultValues: {
      employeeNumber: initialData?.employeeNumber || "",
      cpr: initialData?.cpr || "",
      name: initialData?.name || "",
      siteId: initialData?.siteId || "",
    },
  });

  useEffect(() => {
    async function fetchSites() {
      try {
        const res = await fetch("/api/sites");
        if (!res.ok) throw new Error("Failed to fetch sites");
        const data = await res.json();
        setSites(data.filter((site: SiteOption) => site.status === "active"));
      } catch {
        toast.error("Failed to load sites");
      }
    }

    fetchSites();
  }, []);

  async function onSubmit(values: EmployeeFormData) {
    try {
      const url = isEdit ? `/api/employees/${initialData?.id}` : "/api/employees";
      const method = isEdit ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to save employee");
      }

      const employee = await res.json();
      toast.success(isEdit ? "Employee updated successfully" : "Employee created successfully");

      if (isEdit) {
        router.push("/dashboard/employees");
      } else {
        router.push(`/dashboard/employees/${employee.id}/face`);
      }
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "An error occurred");
    }
  }

  return (
    <Card className="bg-slate-900 border-slate-800 max-w-2xl">
      <CardHeader>
        <CardTitle>{isEdit ? "Edit Employee" : "Enroll Employee"}</CardTitle>
        <CardDescription>
          {isEdit ? "Update employee enrollment details" : "Add the employee, then capture their face"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-slate-300">Employee Name *</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Ahmed Ali"
                      {...field}
                      className="bg-slate-950/50 border-slate-800 text-slate-100"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="employeeNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-slate-300">Employee ID *</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="EMP001"
                        {...field}
                        disabled={isEdit}
                        className="bg-slate-950/50 border-slate-800 text-slate-100"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="cpr"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-slate-300">Government ID Number *</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="123456789"
                        {...field}
                        disabled={isEdit}
                        className="bg-slate-950/50 border-slate-800 text-slate-100"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="siteId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-slate-300">Site *</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger className="bg-slate-950/50 border-slate-800 text-slate-100">
                        <SelectValue placeholder="Select a site" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent className="bg-slate-900 border-slate-800">
                      {sites.map((site) => (
                        <SelectItem key={site.id} value={site.id} className="text-slate-100">
                          {site.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {isEdit && initialData?.id && (
              <Link href={`/dashboard/employees/${initialData.id}/face`} className="block">
                <Button type="button" variant="outline" className="w-full border-slate-700 text-slate-300">
                  <Camera className="w-4 h-4 mr-2" />
                  Capture Face
                </Button>
              </Link>
            )}

            <div className="flex gap-4">
              <Button type="submit" className="bg-blue-600 hover:bg-blue-700" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting ? "Saving..." : isEdit ? "Update Employee" : "Save and Capture Face"}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
                className="border-slate-700 text-slate-300"
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
