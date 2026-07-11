import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { db } from "@/db";
import { users } from "@/db/schema";
import bcrypt from "bcryptjs";
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { PermissionService } from "@/modules/permissions/service/permission.service";

const UpdateAdminSchema = z.object({
  name: z.string().min(2).optional(),
  password: z.string().min(6).optional(),
  role: z.enum(["admin", "manager", "viewer"]).optional(),
});

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    const admin = await db.select().from(users).where(eq(users.id, id)).limit(1);
    if (!admin.length) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const targetUser = admin[0];

    // Enforce tenant boundary unless super_admin
    if (session.role !== "super_admin") {
      if (targetUser.organizationId !== session.organizationId) {
        return NextResponse.json({ error: "Forbidden: Cross-tenant access denied" }, { status: 403 });
      }

      const canView = PermissionService.hasRolePermission(session.role, "view_user");
      if (!canView) {
        return NextResponse.json({ error: "Forbidden: Insufficient permissions" }, { status: 403 });
      }
    }

    return NextResponse.json(targetUser);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch user" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    const targetAdmin = await db.select().from(users).where(eq(users.id, id)).limit(1);
    
    if (!targetAdmin.length) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const targetUser = targetAdmin[0];

    // Enforce tenant boundary unless super_admin
    if (session.role !== "super_admin") {
      if (targetUser.organizationId !== session.organizationId) {
        return NextResponse.json({ error: "Forbidden: Cross-tenant access denied" }, { status: 403 });
      }

      // Must have create_user to edit users
      const canEdit = PermissionService.hasRolePermission(session.role, "create_user");
      if (!canEdit) {
        return NextResponse.json({ error: "Forbidden: Insufficient permissions" }, { status: 403 });
      }

      // Prevents manager/viewer from elevating themselves or others
      if (targetUser.role === "super_admin") {
        return NextResponse.json({ error: "Forbidden: Cannot edit platform super admin" }, { status: 403 });
      }
    }

    const body = await req.json();
    const result = UpdateAdminSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json({ error: result.error.issues }, { status: 400 });
    }

    const { name, password, role } = result.data;

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
    console.error("Error updating user:", error);
    return NextResponse.json({ error: "Failed to update user" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    const targetAdmin = await db.select().from(users).where(eq(users.id, id)).limit(1);
    
    if (!targetAdmin.length) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const targetUser = targetAdmin[0];

    // Enforce tenant boundary unless super_admin
    if (session.role !== "super_admin") {
      if (targetUser.organizationId !== session.organizationId) {
        return NextResponse.json({ error: "Forbidden: Cross-tenant access denied" }, { status: 403 });
      }

      // Must have delete_user to delete users
      const canDelete = PermissionService.hasRolePermission(session.role, "delete_user");
      if (!canDelete) {
        return NextResponse.json({ error: "Forbidden: Insufficient permissions" }, { status: 403 });
      }

      if (targetUser.role === "super_admin") {
        return NextResponse.json({ error: "Forbidden: Cannot delete platform super admin" }, { status: 403 });
      }
    }

    await db.delete(users).where(eq(users.id, id));
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting user:", error);
    return NextResponse.json({ error: "Failed to delete user" }, { status: 500 });
  }
}
