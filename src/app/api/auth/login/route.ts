import { NextResponse } from "next/server";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { loginSession } from "@/lib/auth";
import { loginSchema } from "@/validators/auth.validator";

export async function POST(req: Request) {
  try {
    const parsed = loginSchema.safeParse(await req.json());

    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues }, { status: 400 });
    }

    const { email, password } = parsed.data;
    const userArray = await db.select().from(users).where(eq(users.email, email)).limit(1);
    const user = userArray[0];

    if (!user) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);

    if (!isMatch) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    await loginSession(user.id, user.role as "super_admin" | "admin", user.organizationId);

    return NextResponse.json({
      message: "Logged in successfully",
      user: {
        id: user.id,
        organizationId: user.organizationId,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
