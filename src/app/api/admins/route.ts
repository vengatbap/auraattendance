import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { db } from "@/db";
import { users } from "@/db/schema";
import bcrypt from "bcryptjs";
import { and, eq, ne } from "drizzle-orm";
import { z } from "zod";
import { PermissionService } from "@/modules/permissions/service/permission.service";

const CreateAdminSchema = z.object({
  email: z.string().email(),
  name: z.string().min(2),
  password: z.string().min(6),
  role: z.enum(["admin", "manager", "viewer"]).default("admin"),
});

export async function GET() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (session.role === "super_admin") {
      const allUsers = await db.select().from(users);
      return NextResponse.json(allUsers);
    }

    if (!session.organizationId) {
      return NextResponse.json({ error: "Forbidden: No tenant associated" }, { status: 403 });
    }

    // Check if user is allowed to view other users
    const canView = PermissionService.hasRolePermission(session.role, "view_user");
    if (!canView) {
      return NextResponse.json({ error: "Forbidden: Insufficient permissions" }, { status: 403 });
    }

    const admins = await db
      .select()
      .from(users)
      .where(
        and(
          eq(users.organizationId, session.organizationId),
          ne(users.role, "super_admin")
        )
      );

    return NextResponse.json(admins);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch admins" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user is allowed to create users
    if (session.role !== "super_admin") {
      const canCreate = PermissionService.hasRolePermission(session.role, "create_user");
      if (!canCreate || !session.organizationId) {
        return NextResponse.json({ error: "Forbidden: Insufficient permissions" }, { status: 403 });
      }
    }

    const body = await req.json();
    const result = CreateAdminSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json({ error: result.error.issues }, { status: 400 });
    }

    const { email, name, password, role } = result.data;

    // Check if user already exists globally
    const existingAdmin = await db.select().from(users).where(eq(users.email, email)).limit(1);
    if (existingAdmin.length > 0) {
      return NextResponse.json({ error: "User already exists" }, { status: 409 });
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Create user bound to organizationId (except if global super admin creating organization-less user)
    const newAdmin = await db.insert(users).values({
      email,
      name,
      passwordHash,
      role,
      organizationId: session.role === "super_admin" ? null : session.organizationId,
    }).returning();

    return NextResponse.json(newAdmin[0], { status: 201 });
  } catch (error) {
    console.error("Error creating user:", error);
    return NextResponse.json({ error: "Failed to create user" }, { status: 500 });
  }
}
