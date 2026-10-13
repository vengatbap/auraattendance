import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function GET() {
  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const userArray = await db.select({
      id: users.id,
      email: users.email,
      name: users.name,
      role: users.role,
      isPlatformUser: users.isPlatformUser,
      organizationId: users.organizationId,
    }).from(users).where(eq(users.id, session.userId)).limit(1);

    const user = userArray[0];

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({
      user: {
        ...user,
        organizationId: session.supportTenantId || user.organizationId,
        supportTenantId: session.supportTenantId || null,
      },
    });
  } catch (error) {
    console.error("GET /api/auth/me error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
