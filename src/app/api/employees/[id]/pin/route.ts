import { NextRequest, NextResponse } from "next/server";
import { requireTenantContext } from "@/lib/auth";
import { db } from "@/db";
import { attendanceCredentials } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import * as bcrypt from "bcrypt";


export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { organizationId, userId, role } = await requireTenantContext();
    const { id: employeeId } = await params;
    const body = await req.json();
    const { pin, enabled } = body;

    // TODO: use permission service
    if (role !== "super_admin" && role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const [existing] = await db
      .select()
      .from(attendanceCredentials)
      .where(and(eq(attendanceCredentials.organizationId, organizationId), eq(attendanceCredentials.employeeId, employeeId)));

    let pinHash = existing?.pinHash;
    if (pin) {
      pinHash = await bcrypt.hash(pin, 10);
    }

    if (existing) {
      await db.update(attendanceCredentials)
        .set({
          pinHash,
          enabled: enabled !== undefined ? enabled : existing.enabled,
          failedAttempts: 0,
          lockedUntil: null,
          updatedAt: new Date(),
        })
        .where(eq(attendanceCredentials.id, existing.id));
    } else {
      if (!pin) {
        return NextResponse.json({ error: "PIN is required for new credential" }, { status: 400 });
      }
      await db.insert(attendanceCredentials).values({
        organizationId,
        employeeId,
        pinHash,
        enabled: enabled !== undefined ? enabled : true,
      });
    }

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    const error = err as Error;
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
