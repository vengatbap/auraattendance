import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { sites } from "@/db/schema";
import { eq } from "drizzle-orm";
import { z } from "zod";

const UpdateSiteSchema = z.object({
  name: z.string().min(2).optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  radius: z.number().positive().optional(),
  status: z.enum(["active", "inactive"]).optional(),
});

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const site = await db.select().from(sites).where(eq(sites.id, id)).limit(1);
    if (!site.length) {
      return NextResponse.json({ error: "Site not found" }, { status: 404 });
    }
    return NextResponse.json(site[0]);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch site" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json();
    const result = UpdateSiteSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json({ error: result.error.issues }, { status: 400 });
    }

    const updateData = { ...result.data, updatedAt: new Date() };

    const updated = await db
      .update(sites)
      .set(updateData)
      .where(eq(sites.id, id))
      .returning();

    if (!updated.length) {
      return NextResponse.json({ error: "Site not found" }, { status: 404 });
    }

    return NextResponse.json(updated[0]);
  } catch (error) {
    console.error("Error updating site:", error);
    return NextResponse.json({ error: "Failed to update site" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const deleted = await db.delete(sites).where(eq(sites.id, id)).returning();

    if (!deleted.length) {
      return NextResponse.json({ error: "Site not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting site:", error);
    return NextResponse.json({ error: "Failed to delete site" }, { status: 500 });
  }
}
