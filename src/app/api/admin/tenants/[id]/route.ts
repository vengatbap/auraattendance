import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { db } from "@/db";
import { organizations } from "@/db/schema";
import { eq } from "drizzle-orm";
import { z } from "zod";

const UpdateTenantSchema = z.object({
  status: z.enum(["active", "suspended"]).optional(),
  subscriptionPlan: z.enum(["trial", "standard", "enterprise"]).optional(),
  trialEndsAt: z.string().nullable().optional(),
});

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession();
    if (!session || session.role !== "super_admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await req.json();
    const result = UpdateTenantSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json({ error: result.error.issues }, { status: 400 });
    }

    const updateData: any = { updatedAt: new Date() };
    if (result.data.status) updateData.status = result.data.status;
    if (result.data.subscriptionPlan) updateData.subscriptionPlan = result.data.subscriptionPlan;
    if (result.data.trialEndsAt !== undefined) {
      updateData.trialEndsAt = result.data.trialEndsAt ? new Date(result.data.trialEndsAt) : null;
    }

    const updated = await db
      .update(organizations)
      .set(updateData)
      .where(eq(organizations.id, id))
      .returning();

    if (!updated.length) {
      return NextResponse.json({ error: "Tenant not found" }, { status: 404 });
    }

    return NextResponse.json(updated[0]);
  } catch (error) {
    console.error("Error updating tenant:", error);
    return NextResponse.json({ error: "Failed to update tenant" }, { status: 500 });
  }
}
