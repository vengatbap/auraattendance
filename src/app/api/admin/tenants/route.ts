import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { db } from "@/db";
import { organizations } from "@/db/schema";
import { desc } from "drizzle-orm";

export async function GET() {
  try {
    const session = await getSession();
    if (!session || session.role !== "super_admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const tenants = await db
      .select()
      .from(organizations)
      .orderBy(desc(organizations.createdAt));

    return NextResponse.json(tenants);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch tenants" }, { status: 500 });
  }
}
