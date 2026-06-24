import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { faceProfiles, employees } from "@/db/schema";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { getSession } from "@/lib/auth";

const RegisterFaceSchema = z.object({
  employeeId: z.string().uuid(),
  descriptor: z.array(z.number()), // Face descriptor array
  images: z.array(z.string()).optional(), // Base64 encoded images
});

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const result = RegisterFaceSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json({ error: result.error.issues }, { status: 400 });
    }

    const { employeeId, descriptor } = result.data;

    // Verify employee exists
    const [employee] = await db
      .select()
      .from(employees)
      .where(eq(employees.id, employeeId))
      .limit(1);

    if (!employee) {
      return NextResponse.json({ error: "Employee not found" }, { status: 404 });
    }

    // Delete existing face profile if any (one per employee)
    await db.delete(faceProfiles).where(eq(faceProfiles.employeeId, employeeId));

    // Create new face profile
    const [newProfile] = await db
      .insert(faceProfiles)
      .values({
        employeeId,
        embedding: descriptor,
      })
      .returning();

    return NextResponse.json(
      {
        message: "Face registered successfully",
        faceProfile: newProfile,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error registering face:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to register face" },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const employeeId = req.nextUrl.searchParams.get("employeeId");

    if (!employeeId) {
      return NextResponse.json({ error: "employeeId is required" }, { status: 400 });
    }

    const [profile] = await db
      .select()
      .from(faceProfiles)
      .where(eq(faceProfiles.employeeId, employeeId))
      .limit(1);

    if (!profile) {
      return NextResponse.json({ error: "Face profile not found" }, { status: 404 });
    }

    return NextResponse.json(profile);
  } catch (error) {
    console.error("Error fetching face profile:", error);
    return NextResponse.json({ error: "Failed to fetch face profile" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const employeeId = req.nextUrl.searchParams.get("employeeId");

    if (!employeeId) {
      return NextResponse.json({ error: "employeeId is required" }, { status: 400 });
    }

    await db.delete(faceProfiles).where(eq(faceProfiles.employeeId, employeeId));

    return NextResponse.json({ message: "Face profile deleted successfully" });
  } catch (error) {
    console.error("Error deleting face profile:", error);
    return NextResponse.json({ error: "Failed to delete face profile" }, { status: 500 });
  }
}
