import { z } from "zod";

export const createOrganizationSchema = z.object({
  name: z.string().min(2, "Company name must be at least 2 characters").max(255),
  slug: z
    .string()
    .min(2, "Slug must be at least 2 characters")
    .max(120)
    .regex(/^[a-z0-9-]+$/, "Slug must contain only lowercase letters, numbers, and hyphens"),
  logo: z.string().optional().nullable(),
  favicon: z.string().optional().nullable(),
  primaryColor: z.string().regex(/^#[0-9a-fA-F]{6}$/, "Invalid primary hex color").optional(),
  secondaryColor: z.string().regex(/^#[0-9a-fA-F]{6}$/, "Invalid secondary hex color").optional(),
});

export const updateOrganizationSchema = z.object({
  name: z.string().min(2, "Company name must be at least 2 characters").optional(),
  slug: z
    .string()
    .min(2)
    .regex(/^[a-z0-9-]+$/, "Slug must contain only lowercase letters, numbers, and hyphens")
    .optional(),
  logo: z.string().optional().nullable(),
  favicon: z.string().optional().nullable(),
  primaryColor: z.string().regex(/^#[0-9a-fA-F]{6}$/, "Invalid primary hex color").optional(),
  secondaryColor: z.string().regex(/^#[0-9a-fA-F]{6}$/, "Invalid secondary hex color").optional(),
  companyName: z.string().optional().nullable(),
  supportEmail: z.string().email("Invalid support email").optional().nullable(),
  timezone: z.string().min(1, "Timezone is required").optional(),
  language: z.string().max(10).optional(),
  dateFormat: z.string().min(1).optional(),
  attendanceMode: z.enum(["face", "qr", "gps", "face_gps", "face_qr"]).optional(),
  allowMultiplePunches: z.boolean().optional(),
  minimumPunchGapMinutes: z.number().int().positive().optional(),
  autoCheckout: z.boolean().optional(),
  autoCheckoutTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Invalid auto checkout time (HH:MM)").optional(),
  gracePeriodMinutes: z.number().int().nonnegative().optional(),
  lateAfterTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Invalid late mark threshold (HH:MM)").optional(),
  faceMatchThreshold: z.number().min(0.1).max(1.0).optional(),
  faceLightingThreshold: z.number().min(0.0).max(1.0).optional(),
  faceMinSize: z.number().int().positive().optional(),
  faceCaptureDelaySeconds: z.number().int().positive().optional(),
  faceRetryAttempts: z.number().int().positive().optional(),
});
