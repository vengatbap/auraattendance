import { z } from "zod";

export const siteCreateSchema = z.object({
  name: z.string().min(2, "Site name must be at least 2 characters").max(255),
  latitude: z.number().min(-90, "Latitude must be between -90 and 90").max(90),
  longitude: z.number().min(-180, "Longitude must be between -180 and 180").max(180),
  radius: z.number().min(10, "Radius must be at least 10 meters").max(2000),
  status: z.enum(["active", "inactive"]).default("active"),
  allowedDevices: z.enum(["browser", "kiosk", "tablet", "both"]).default("both"),
});

export const siteUpdateSchema = siteCreateSchema.partial();

export type SiteCreateInput = z.infer<typeof siteCreateSchema>;
export type SiteUpdateInput = z.infer<typeof siteUpdateSchema>;
