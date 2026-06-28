import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { organizations } from "@/db/schema";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { getSession } from "@/lib/auth";

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
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const [org] = await db
      .select()
      .from(organizations)
      .where(eq(organizations.id, session.organizationId))
      .limit(1);

    if (!org) {
      return NextResponse.json({ error: "Organization not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: org });
  } catch (error) {
    console.error("Get settings error:", error);
    return NextResponse.json({ error: "Failed to fetch settings" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session || !session.organizationId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const data = await req.json();
    const result = settingsSchema.safeParse(data);
    if (!result.success) {
      return NextResponse.json({ error: result.error.issues }, { status: 400 });
    }

    const [updated] = await db
      .update(organizations)
      .set({
        ...result.data,
        updatedAt: new Date(),
      })
      .where(eq(organizations.id, session.organizationId))
      .returning();

    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    console.error("Save settings error:", error);
    return NextResponse.json({ error: "Failed to save settings" }, { status: 500 });
  }
}
