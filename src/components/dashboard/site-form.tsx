"use client";

import { useState } from "react";
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
import { LocateFixed, Loader2 } from "lucide-react";

const siteSchema = z.object({
  name: z.string().min(2, "Site name must be at least 2 characters").max(255),
  latitude: z.number().min(-90, "Latitude must be between -90 and 90").max(90),
  longitude: z.number().min(-180, "Longitude must be between -180 and 180").max(180),
  radius: z.number().min(10, "Radius must be at least 10 meters").max(2000),
  status: z.enum(["active", "inactive"]),
  allowedDevices: z.enum(["browser", "kiosk", "tablet", "both"]),
});

type SiteFormData = z.infer<typeof siteSchema>;

interface SiteFormProps {
  initialData?: Partial<SiteFormData> & { id?: string };
  isEdit?: boolean;
}

export function SiteForm({ initialData, isEdit }: SiteFormProps) {
  const router = useRouter();
  const [geoLoading, setGeoLoading] = useState(false);

  const form = useForm<SiteFormData>({
    resolver: zodResolver(siteSchema),
    defaultValues: {
      name: initialData?.name || "",
      latitude: initialData?.latitude || 0,
      longitude: initialData?.longitude || 0,
      radius: initialData?.radius || 50,
      status: (initialData?.status as "active" | "inactive") || "active",
      allowedDevices: (initialData?.allowedDevices as "browser" | "kiosk" | "tablet" | "both") || "both",
    },
  });

  const watchRadius = form.watch("radius");

  const handleGeoFill = () => {
    if (typeof window === "undefined" || !navigator.geolocation) {
      toast.error("Geolocation is not supported by your browser");
      return;
    }
    setGeoLoading(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        form.setValue("latitude", parseFloat(position.coords.latitude.toFixed(6)));
        form.setValue("longitude", parseFloat(position.coords.longitude.toFixed(6)));
        toast.success("Coordinates filled successfully!");
        setGeoLoading(false);
      },
      () => {
        toast.error("Could not obtain location. Please grant permission.");
        setGeoLoading(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  async function onSubmit(values: SiteFormData) {
    try {
      const url = isEdit ? `/api/sites/${initialData?.id}` : "/api/sites";
      const method = isEdit ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });

      const result = await res.json();
      if (!res.ok || !result.success) {
        throw new Error(result.message || "Failed to save site");
      }

      toast.success(isEdit ? "Site updated successfully" : "Site created successfully");
      router.push("/dashboard/sites");
      router.refresh();
    } catch (error: unknown) {
      const err = error as Error;
      toast.error(err.message || "An error occurred");
    }
  }

  return (
    <Card className="bg-slate-950/40 border-slate-900 max-w-2xl rounded-3xl shadow-xl">
      <CardHeader>
        <CardTitle className="text-xl font-bold">{isEdit ? "Edit Site details" : "Create New Site"}</CardTitle>
        <CardDescription className="text-slate-400 text-xs">
          {isEdit ? "Update site details, allowed devices, and coordinates." : "Add a new office location with geofencing perimeter."}
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
                      placeholder="e.g., Headquarters"
                      {...field}
                      className="bg-slate-950 border-slate-900 text-slate-100 placeholder:text-slate-700"
                    />
                  </FormControl>
                  <FormMessage className="text-red-400" />
                </FormItem>
              )}
            />

            <div className="grid sm:grid-cols-2 gap-4">
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
                        onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                        className="bg-slate-950 border-slate-900 text-slate-100"
                      />
                    </FormControl>
                    <FormMessage className="text-red-400" />
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
                        onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                        className="bg-slate-950 border-slate-900 text-slate-100"
                      />
                    </FormControl>
                    <FormMessage className="text-red-400" />
                  </FormItem>
                )}
              />
            </div>

            <div className="flex gap-4 items-center">
              <Button
                type="button"
                variant="outline"
                onClick={handleGeoFill}
                disabled={geoLoading}
                className="h-10 text-xs border-slate-800 text-slate-300"
              >
                {geoLoading ? (
                  <Loader2 className="size-3.5 mr-2 animate-spin" />
                ) : (
                  <LocateFixed className="size-3.5 mr-2" />
                )}
                Auto-fill coordinates
              </Button>
              <p className="text-[10px] text-slate-500 leading-normal">
                Grabs your current browser coordinates to automatically lock the office geofence.
              </p>
            </div>

            <FormField
              control={form.control}
              name="radius"
              render={({ field }) => (
                <FormItem className="space-y-3">
                  <div className="flex justify-between items-center text-xs font-semibold">
                    <FormLabel className="text-slate-300">Attendance Radius Limit</FormLabel>
                    <span className="text-blue-500 font-bold">{watchRadius} meters</span>
                  </div>
                  <FormControl>
                    <div className="space-y-2">
                      <input
                        type="range"
                        min="20"
                        max="500"
                        step="10"
                        value={field.value}
                        onChange={(e) => field.onChange(parseInt(e.target.value) || 50)}
                        className="w-full accent-blue-600 bg-slate-900 h-1.5 rounded-lg appearance-none cursor-pointer border border-slate-800"
                      />
                      <Input
                        type="number"
                        {...field}
                        onChange={(e) => field.onChange(parseFloat(e.target.value) || 50)}
                        className="bg-slate-950 border-slate-900 text-slate-100 w-24 text-xs mt-1"
                      />
                    </div>
                  </FormControl>
                  <FormMessage className="text-red-400" />
                </FormItem>
              )}
            />

            <div className="grid sm:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="allowedDevices"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-slate-300">Allowed Punch Devices</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger className="bg-slate-950 border-slate-900 text-slate-100">
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="bg-slate-900 border-slate-900">
                        <SelectItem value="both" className="text-slate-100">Both Browser & Tablet</SelectItem>
                        <SelectItem value="browser" className="text-slate-100">Browser Only</SelectItem>
                        <SelectItem value="kiosk" className="text-slate-100">Kiosk Mode Only</SelectItem>
                        <SelectItem value="tablet" className="text-slate-100">Tablet Only</SelectItem>
                      </SelectContent>
                    </Select>
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
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger className="bg-slate-950 border-slate-900 text-slate-100">
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="bg-slate-900 border-slate-900">
                        <SelectItem value="active" className="text-slate-100">Active</SelectItem>
                        <SelectItem value="inactive" className="text-slate-100">Inactive</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage className="text-red-400" />
                  </FormItem>
                )}
              />
            </div>

            <div className="flex gap-4 pt-4 border-t border-slate-900">
              <Button type="submit" className="bg-blue-600 hover:bg-blue-500 font-bold px-6 h-11" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting ? "Saving..." : "Save Site Settings"}
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
