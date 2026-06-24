"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
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

const siteSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  radius: z.number().positive("Radius must be positive"),
  status: z.enum(["active", "inactive"]),
});

type SiteFormData = z.infer<typeof siteSchema>;

interface SiteFormProps {
  initialData?: Partial<SiteFormData> & { id?: string };
  isEdit?: boolean;
}

export function SiteForm({ initialData, isEdit }: SiteFormProps) {
  const router = useRouter();
  const form = useForm<SiteFormData>({
    resolver: zodResolver(siteSchema),
    defaultValues: {
      name: initialData?.name || "",
      latitude: initialData?.latitude || 0,
      longitude: initialData?.longitude || 0,
      radius: initialData?.radius || 50,
      status: (initialData?.status as "active" | "inactive") || "active",
    },
  });

  async function onSubmit(values: SiteFormData) {
    try {
      const url = isEdit ? `/api/sites/${initialData?.id}` : "/api/sites";
      const method = isEdit ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to save site");
      }

      toast.success(isEdit ? "Site updated successfully" : "Site created successfully");
      router.push("/dashboard/sites");
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "An error occurred");
    }
  }

  return (
    <Card className="bg-slate-900 border-slate-800 max-w-2xl">
      <CardHeader>
        <CardTitle>{isEdit ? "Edit Site" : "Create New Site"}</CardTitle>
        <CardDescription>
          {isEdit ? "Update site details" : "Add a new company location"}
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
                  <FormLabel className="text-slate-300">Site Name</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="e.g., SEEF Office"
                      {...field}
                      className="bg-slate-950/50 border-slate-800 text-slate-100"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="latitude"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-slate-300">Latitude</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.000001"
                        placeholder="26.160345"
                        {...field}
                        onChange={(e) => field.onChange(parseFloat(e.target.value))}
                        className="bg-slate-950/50 border-slate-800 text-slate-100"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="longitude"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-slate-300">Longitude</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.000001"
                        placeholder="50.556275"
                        {...field}
                        onChange={(e) => field.onChange(parseFloat(e.target.value))}
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
              name="radius"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-slate-300">Attendance Radius (meters)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      placeholder="50"
                      {...field}
                      onChange={(e) => field.onChange(parseFloat(e.target.value))}
                      className="bg-slate-950/50 border-slate-800 text-slate-100"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-slate-300">Status</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger className="bg-slate-950/50 border-slate-800 text-slate-100">
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent className="bg-slate-900 border-slate-800">
                      <SelectItem value="active" className="text-slate-100">
                        Active
                      </SelectItem>
                      <SelectItem value="inactive" className="text-slate-100">
                        Inactive
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex gap-4">
              <Button type="submit" className="bg-blue-600 hover:bg-blue-700" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting ? "Saving..." : "Save Site"}
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
