import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { users } from "@/db/schema";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { z } from "zod";

const CreateAdminSchema = z.object({
  email: z.string().email(),
  name: z.string().min(2),
  password: z.string().min(6),
  role: z.enum(["admin", "super_admin"]).default("admin"),
});

export async function GET() {
  try {
    const admins = await db.select().from(users);
    return NextResponse.json(admins);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch admins" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const result = CreateAdminSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json({ error: result.error.issues }, { status: 400 });
    }

    const { email, name, password, role } = result.data;

    // Check if admin already exists
    const existingAdmin = await db.select().from(users).where(eq(users.email, email)).limit(1);
    if (existingAdmin.length > 0) {
      return NextResponse.json({ error: "Admin already exists" }, { status: 409 });
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Create admin
    const newAdmin = await db.insert(users).values({
      email,
      name,
      passwordHash,
      role,
    }).returning();

    return NextResponse.json(newAdmin[0], { status: 201 });
  } catch (error) {
    console.error("Error creating admin:", error);
    return NextResponse.json({ error: "Failed to create admin" }, { status: 500 });
  }
}
