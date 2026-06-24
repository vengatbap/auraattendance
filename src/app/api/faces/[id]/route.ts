import { NextRequest, NextResponse } from "next/server";
import { faceService } from "@/services/face.service";
import { employeeService } from "@/services/employee.service";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { faceProfiles } from "@/db/schema";

const enrollSchema = z.object({
  embedding: z.array(z.number()).min(1),
  enrollmentPhoto: z.string().optional(),
});

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const profile = await faceService.getByEmployee(id);
    if (!profile) {
      return NextResponse.json({ error: "Face profile not found" }, { status: 404 });
    }
    return NextResponse.json(profile);
  } catch (error) {
    console.error("Get face profile error:", error);
    return NextResponse.json({ error: "Failed to fetch face profile" }, { status: 500 });
  }
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const data = await req.json();
    const result = enrollSchema.safeParse(data);
    if (!result.success) {
      return NextResponse.json({ error: result.error.issues }, { status: 400 });
    }
    const response = await faceService.enroll(id, result.data.embedding, result.data.enrollmentPhoto);
    return NextResponse.json(response);
  } catch (error) {
    console.error("Enroll face error:", error);
    return NextResponse.json({ error: error instanceof Error ? error.message : "Failed to enroll face" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const response = await faceService.delete(id);
    return NextResponse.json(response);
  } catch (error) {
    console.error("Delete face error:", error);
    return NextResponse.json({ error: error instanceof Error ? error.message : "Failed to delete face profile" }, { status: 500 });
  }
}
