import { z } from "zod";
import { SITE_STATUSES } from "@/constants";

export const siteCreateSchema = z.object({
  name: z.string().min(1),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  radius: z.number().positive().default(50),
  status: z.enum(SITE_STATUSES).default("active"),
});

export const siteUpdateSchema = siteCreateSchema.partial();

export type SiteCreateInput = z.infer<typeof siteCreateSchema>;
export type SiteUpdateInput = z.infer<typeof siteUpdateSchema>;
