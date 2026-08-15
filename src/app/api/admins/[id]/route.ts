import { NextRequest } from "next/server";
import { getSession } from "@/lib/auth";
import { db } from "@/db";
import { users } from "@/db/schema";
import bcrypt from "bcryptjs";
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { PermissionService } from "@/lib/rbac";
import { createApiResponse } from "@/lib/api-response";

const UpdateAdminSchema = z.object({
  name: z.string().min(2).optional(),
  password: z.string().min(6).optional(),
  role: z.enum(["admin", "manager", "viewer"]).optional(),
});

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession();
    if (!session || !session.organizationId) {
      return createApiResponse({
        success: false,
        message: "Unauthorized",
        status: 401,
      });
    }

    if (PermissionService.cannot(session, "user.read")) {
      return createApiResponse({
        success: false,
        message: "Forbidden: insufficient permissions",
        status: 403,
      });
    }

    const { id } = await params;
    const admin = await db.select().from(users).where(eq(users.id, id)).limit(1);
    if (!admin.length) {
      return createApiResponse({
        success: false,
        message: "User not found",
        status: 404,
      });
    }

    const targetUser = admin[0];

    // Enforce tenant boundary unless platform operator
    if (!session.isPlatformUser && targetUser.organizationId !== session.organizationId) {
      return createApiResponse({
        success: false,
        message: "Forbidden: Cross-tenant access denied",
        status: 403,
      });
    }

    return createApiResponse({
      success: true,
      message: "User fetched successfully",
      data: targetUser,
    });
  } catch (error) {
    console.error("Failed to fetch user:", error);
    return createApiResponse({
      success: false,
      message: "Failed to fetch user",
      status: 500,
    });
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession();
    if (!session || !session.organizationId) {
      return createApiResponse({
        success: false,
        message: "Unauthorized",
        status: 401,
      });
    }

    if (PermissionService.cannot(session, "user.update")) {
      return createApiResponse({
        success: false,
        message: "Forbidden: insufficient permissions",
        status: 403,
      });
    }

    const { id } = await params;
    const targetAdmin = await db.select().from(users).where(eq(users.id, id)).limit(1);
    
    if (!targetAdmin.length) {
      return createApiResponse({
        success: false,
        message: "User not found",
        status: 404,
      });
    }

    const targetUser = targetAdmin[0];

    // Enforce tenant boundary unless platform operator
    if (!session.isPlatformUser && targetUser.organizationId !== session.organizationId) {
      return createApiResponse({
        success: false,
        message: "Forbidden: Cross-tenant access denied",
        status: 403,
      });
    }

    const body = await req.json();
    const result = UpdateAdminSchema.safeParse(body);

    if (!result.success) {
      return createApiResponse({
        success: false,
        message: "Validation failed",
        errors: result.error.issues,
        status: 400,
      });
    }

    const { name, password, role } = result.data;
    const currentVersion = targetUser.version ?? 1;

    const updateData: Partial<typeof users.$inferInsert> = {
      updatedAt: new Date(),
      version: currentVersion + 1,
    };

    if (name) updateData.name = name;
    if (role) updateData.role = role;
    if (password) {
      updateData.passwordHash = await bcrypt.hash(password, 10);
    }

    const [updated] = await db
      .update(users)
      .set(updateData)
      .where(
        and(
          eq(users.id, id),
          eq(users.version, currentVersion)
        )
      )
      .returning();

    if (!updated) {
      return createApiResponse({
        success: false,
        message: "Concurrent update detected. User record has been modified by another process. Please reload and try again.",
        status: 409,
      });
    }

    return createApiResponse({
      success: true,
      message: "User updated successfully",
      data: updated,
    });
  } catch (error) {
    console.error("Error updating user:", error);
    return createApiResponse({
      success: false,
      message: "Failed to update user",
      status: 500,
    });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession();
    if (!session || !session.organizationId) {
      return createApiResponse({
        success: false,
        message: "Unauthorized",
        status: 401,
      });
    }

    if (PermissionService.cannot(session, "user.archive")) {
      return createApiResponse({
        success: false,
        message: "Forbidden: insufficient permissions",
        status: 403,
      });
    }

    const { id } = await params;
    const targetAdmin = await db.select().from(users).where(eq(users.id, id)).limit(1);
    
    if (!targetAdmin.length) {
      return createApiResponse({
        success: false,
        message: "User not found",
        status: 404,
      });
    }

    const targetUser = targetAdmin[0];

    // Enforce tenant boundary unless platform operator
    if (!session.isPlatformUser && targetUser.organizationId !== session.organizationId) {
      return createApiResponse({
        success: false,
        message: "Forbidden: Cross-tenant access denied",
        status: 403,
      });
    }

    if (targetUser.role === "super_admin") {
      return createApiResponse({
        success: false,
        message: "Forbidden: Cannot delete platform super admin",
        status: 403,
      });
    }

    // Soft delete by updating deletedAt timestamp & status to archive
    await db
      .update(users)
      .set({
        deletedAt: new Date(),
        updatedAt: new Date(),
        version: (targetUser.version ?? 1) + 1,
      })
      .where(eq(users.id, id));

    return createApiResponse({
      success: true,
      message: "User deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting user:", error);
    return createApiResponse({
      success: false,
      message: "Failed to delete user",
      status: 500,
    });
  }
}
