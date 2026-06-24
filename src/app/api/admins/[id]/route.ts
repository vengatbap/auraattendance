import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { db } from "@/db";
import { users } from "@/db/schema";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { z } from "zod";

const UpdateAdminSchema = z.object({
  name: z.string().min(2).optional(),
  password: z.string().min(6).optional(),
  role: z.enum(["admin", "super_admin"]).optional(),
});

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    const admin = await db.select().from(users).where(eq(users.id, id)).limit(1);
    if (!admin.length) {
      return NextResponse.json({ error: "Admin not found" }, { status: 404 });
    }

    if (session.role !== "super_admin" && admin[0].role === "super_admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    return NextResponse.json(admin[0]);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch admin" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    const targetAdmin = await db.select().from(users).where(eq(users.id, id)).limit(1);
    
    if (!targetAdmin.length) {
      return NextResponse.json({ error: "Admin not found" }, { status: 404 });
    }

    if (session.role !== "super_admin" && targetAdmin[0].role === "super_admin") {
      return NextResponse.json({ error: "Forbidden: Cannot edit super admin" }, { status: 403 });
    }

    const body = await req.json();
    const result = UpdateAdminSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json({ error: result.error.issues }, { status: 400 });
    }

    const { name, password, role } = result.data;
    if (session.role !== "super_admin" && role === "super_admin") {
      return NextResponse.json({ error: "Forbidden: Cannot promote to super admin" }, { status: 403 });
    }

    const updateData: any = { updatedAt: new Date() };

    if (name) updateData.name = name;
    if (role) updateData.role = role;
    if (password) {
      updateData.passwordHash = await bcrypt.hash(password, 10);
    }

    const updated = await db
      .update(users)
      .set(updateData)
      .where(eq(users.id, id))
      .returning();

    return NextResponse.json(updated[0]);
  } catch (error) {
    console.error("Error updating admin:", error);
    return NextResponse.json({ error: "Failed to update admin" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    const targetAdmin = await db.select().from(users).where(eq(users.id, id)).limit(1);
    
    if (!targetAdmin.length) {
      return NextResponse.json({ error: "Admin not found" }, { status: 404 });
    }

    if (session.role !== "super_admin" && targetAdmin[0].role === "super_admin") {
      return NextResponse.json({ error: "Forbidden: Cannot delete super admin" }, { status: 403 });
    }

    await db.delete(users).where(eq(users.id, id));
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting admin:", error);
    return NextResponse.json({ error: "Failed to delete admin" }, { status: 500 });
  }
}
