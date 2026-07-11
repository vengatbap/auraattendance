import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { db } from "@/db";
import { organizations } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function GET(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session || session.role !== "super_admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const orgId = searchParams.get("organizationId");

    if (!orgId) {
      return NextResponse.json({ error: "Organization ID is required" }, { status: 400 });
    }

    const org = await db
      .select({ featureFlags: organizations.featureFlags })
      .from(organizations)
      .where(eq(organizations.id, orgId))
      .limit(1);

    if (!org.length) {
      return NextResponse.json({ error: "Organization not found" }, { status: 404 });
    }

    return NextResponse.json({ featureFlags: org[0].featureFlags });
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch feature flags" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session || session.role !== "super_admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { organizationId, featureFlags } = body;

    if (!organizationId || !featureFlags) {
      return NextResponse.json({ error: "Organization ID and feature flags are required" }, { status: 400 });
    }

    const updated = await db
      .update(organizations)
      .set({
        featureFlags,
        updatedAt: new Date(),
      })
      .where(eq(organizations.id, organizationId))
      .returning();

    if (!updated.length) {
      return NextResponse.json({ error: "Organization not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, featureFlags: updated[0].featureFlags });
  } catch (error) {
    console.error("Error updating feature flags:", error);
    return NextResponse.json({ error: "Failed to update feature flags" }, { status: 500 });
  }
}
