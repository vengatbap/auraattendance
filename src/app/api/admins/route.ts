import { NextRequest } from "next/server";
import { getSession } from "@/lib/auth";
import { db } from "@/db";
import { users } from "@/db/schema";
import bcrypt from "bcryptjs";
import { and, eq, ne, isNull } from "drizzle-orm";
import { z } from "zod";
import { PermissionService } from "@/lib/rbac";
import { createApiResponse } from "@/lib/api-response";

const CreateAdminSchema = z.object({
  email: z.string().email(),
  name: z.string().min(2),
  password: z.string().min(6),
  role: z.enum(["admin", "manager", "viewer"]).default("admin"),
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

    if (PermissionService.cannot(session, "user.read")) {
      return createApiResponse({
        success: false,
        message: "Forbidden: insufficient permissions",
        status: 403,
      });
    }

    // Enforce tenant boundary unless platform operator
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const conditions: any[] = [isNull(users.deletedAt)];
    if (!session.isPlatformUser) {
      conditions.push(eq(users.organizationId, session.organizationId));
      conditions.push(ne(users.role, "super_admin"));
    }

    const admins = await db
      .select()
      .from(users)
      .where(and(...conditions));

    return createApiResponse({
      success: true,
      message: "Admins fetched successfully",
      data: admins,
    });
  } catch (error) {
    console.error("Failed to fetch admins:", error);
    return createApiResponse({
      success: false,
      message: "Failed to fetch admins",
      status: 500,
    });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session || !session.organizationId) {
      return createApiResponse({
        success: false,
        message: "Unauthorized",
        status: 401,
      });
    }

    if (PermissionService.cannot(session, "user.invite")) {
      return createApiResponse({
        success: false,
        message: "Forbidden: insufficient permissions",
        status: 403,
      });
    }

    const body = await req.json();
    const result = CreateAdminSchema.safeParse(body);

    if (!result.success) {
      return createApiResponse({
        success: false,
        message: "Validation failed",
        errors: result.error.issues,
        status: 400,
      });
    }

    const { email, name, password, role } = result.data;

    // Check if user already exists globally
    const [existingAdmin] = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (existingAdmin) {
      return createApiResponse({
        success: false,
        message: "User already exists",
        status: 409,
      });
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Create user bound to organizationId (except if global super admin creating organization-less user)
    const [newAdmin] = await db.insert(users).values({
      email,
      name,
      passwordHash,
      role,
      organizationId: session.isPlatformUser ? null : session.organizationId,
      version: 1,
    }).returning();

    return createApiResponse({
      success: true,
      message: "Admin created successfully",
      data: newAdmin,
      status: 201,
    });
  } catch (error) {
    console.error("Error creating user:", error);
    return createApiResponse({
      success: false,
      message: "Failed to create user",
      status: 500,
    });
  }
}
