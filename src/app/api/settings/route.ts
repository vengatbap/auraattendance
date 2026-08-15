import { NextRequest } from "next/server";
import { db } from "@/db";
import { organizations } from "@/db/schema";
import { z } from "zod";
import { eq, and } from "drizzle-orm";
import { getSession } from "@/lib/auth";
import { PermissionService } from "@/lib/rbac";
import { createApiResponse } from "@/lib/api-response";

const settingsSchema = z.object({
  name: z.string().min(1).optional(),
  companyName: z.string().optional().nullable(),
  logo: z.string().optional().nullable(),
  primaryColor: z.string().optional(),
  secondaryColor: z.string().optional(),
  timezone: z.string().optional(),
  supportEmail: z.string().email().or(z.literal("")).optional().nullable(),
  allowMultiplePunches: z.boolean().optional(),
  minimumPunchGapMinutes: z.number().int().min(0).optional(),
  autoCheckout: z.boolean().optional(),
  autoCheckoutTime: z.string().regex(/^\d{2}:\d{2}$/).optional(),
  gracePeriodMinutes: z.number().int().min(0).optional(),
  lateAfterTime: z.string().regex(/^\d{2}:\d{2}$/).optional(),
  faceMatchThreshold: z.number().min(0).max(1).optional(),
  smtpSettings: z
    .object({
      host: z.string().optional(),
      port: z.number().optional(),
      user: z.string().optional(),
      pass: z.string().optional(),
      fromEmail: z.string().email().optional(),
    })
    .optional()
    .nullable(),
  whatsappEnabled: z.boolean().optional(),
  smsEnabled: z.boolean().optional(),
});

export async function GET() {
  try {
    const session = await getSession();
    if (!session || !session.organizationId) {
      return createApiResponse({
        success: false,
        message: "Unauthorized",
        status: 401,
      });
    }

    // RBAC Authorization check
    if (PermissionService.cannot(session, "settings.read")) {
      return createApiResponse({
        success: false,
        message: "Forbidden: insufficient permissions",
        status: 403,
      });
    }

    const [org] = await db
      .select()
      .from(organizations)
      .where(eq(organizations.id, session.organizationId))
      .limit(1);

    if (!org) {
      return createApiResponse({
        success: false,
        message: "Organization not found",
        status: 404,
      });
    }

    return createApiResponse({
      success: true,
      message: "Settings fetched successfully",
      data: org,
    });
  } catch (error) {
    console.error("Get settings error:", error);
    return createApiResponse({
      success: false,
      message: "Failed to fetch settings",
      status: 500,
    });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session || !session.organizationId) {
      return createApiResponse({
        success: false,
        message: "Unauthorized",
        status: 401,
      });
    }

    // RBAC Authorization check
    if (PermissionService.cannot(session, "settings.update")) {
      return createApiResponse({
        success: false,
        message: "Forbidden: insufficient permissions",
        status: 403,
      });
    }

    const data = await req.json();
    const result = settingsSchema.safeParse(data);
    if (!result.success) {
      return createApiResponse({
        success: false,
        message: "Validation failed",
        errors: result.error.issues,
        status: 400,
      });
    }

    // Fetch original organization settings to extract the version for optimistic locking
    const [originalOrg] = await db
      .select()
      .from(organizations)
      .where(eq(organizations.id, session.organizationId))
      .limit(1);

    if (!originalOrg) {
      return createApiResponse({
        success: false,
        message: "Organization not found",
        status: 404,
      });
    }

    const currentVersion = originalOrg.version ?? 1;

    const [updated] = await db
      .update(organizations)
      .set({
        ...result.data,
        updatedAt: new Date(),
        version: currentVersion + 1,
      })
      .where(
        and(
          eq(organizations.id, session.organizationId),
          eq(organizations.version, currentVersion)
        )
      )
      .returning();

    if (!updated) {
      return createApiResponse({
        success: false,
        message: "Concurrent update detected. Organization settings have been modified. Please reload and try again.",
        status: 409,
      });
    }

    return createApiResponse({
      success: true,
      message: "Settings saved successfully",
      data: updated,
    });
  } catch (error) {
    console.error("Save settings error:", error);
    return createApiResponse({
      success: false,
      message: "Failed to save settings",
      status: 500,
    });
  }
}
