import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { faceProfiles, employees } from "@/db/schema";
import { and, eq, isNull } from "drizzle-orm";
import { z } from "zod";
import { getSession } from "@/lib/auth";
import { AuditService } from "@/modules/audit/service/audit.service";
import { logger } from "@/lib/logger";

const RegisterFaceSchema = z.object({
  employeeId: z.string().uuid(),
  descriptor: z.array(z.number()), // Face descriptor array (128 floats)
  images: z.array(z.string()).optional(),
});

function getEuclideanDistance(arr1: number[], arr2: number[]): number {
  if (arr1.length !== arr2.length) return 1.0;
  let sum = 0;
  for (let i = 0; i < arr1.length; i++) {
    const diff = arr1[i] - arr2[i];
    sum += diff * diff;
  }
  return Math.sqrt(sum);
}

export async function POST(req: NextRequest) {
  return logger.track("POST /api/faces/register", async () => {
    try {
      const session = await getSession();
      if (!session || !session.organizationId) {
        return NextResponse.json(
          { success: false, message: "Unauthorized", data: null, meta: null, errors: { global: ["Authentication required"] } },
          { status: 401 }
        );
      }

      const body = await req.json();
      const result = RegisterFaceSchema.safeParse(body);

      if (!result.success) {
        return NextResponse.json(
          { success: false, message: "Invalid payload", data: null, meta: null, errors: result.error.format() },
          { status: 400 }
        );
      }

      const { employeeId, descriptor } = result.data;

      // 1. Verify employee exists and belongs to the same organization
      const [employee] = await db
        .select()
        .from(employees)
        .where(
          and(
            eq(employees.id, employeeId),
            eq(employees.organizationId, session.organizationId),
            isNull(employees.deletedAt)
          )
        )
        .limit(1);

      if (!employee) {
        return NextResponse.json(
          { success: false, message: "Employee not found", data: null, meta: null, errors: { global: ["Employee not found"] } },
          { status: 404 }
        );
      }

      // 2. Perform duplicate face vector checks in the tenant
      const otherProfiles = await db
        .select()
        .from(faceProfiles)
        .where(eq(faceProfiles.organizationId, session.organizationId));

      for (const profile of otherProfiles) {
        if (profile.employeeId === employeeId) continue;
        const dist = getEuclideanDistance(descriptor, profile.embedding as number[]);
        if (dist < 0.45) {
          // Similarity distance threshold exceeded, block registration!
          return NextResponse.json(
            {
              success: false,
              message: "Duplicate face profile detected. This biometric pattern matches another registered employee.",
              data: null,
              meta: null,
              errors: { global: ["Duplicate biometric match"] },
            },
            { status: 409 }
          );
        }
      }

      // 3. Delete existing face profile for this employee (only one active face per employee)
      await db
        .delete(faceProfiles)
        .where(
          and(
            eq(faceProfiles.employeeId, employeeId),
            eq(faceProfiles.organizationId, session.organizationId)
          )
        );

      // 4. Create new face profile
      const [newProfile] = await db
        .insert(faceProfiles)
        .values({
          organizationId: session.organizationId,
          employeeId,
          embedding: descriptor,
          isActive: true,
          version: 1,
        })
        .returning();

      // Audit Log
      await AuditService.log({
        organizationId: session.organizationId,
        userId: session.userId,
        action: "register_biometrics",
        entity: "employee",
        entityId: employeeId,
        details: { employeeCode: employee.employeeCode, name: employee.name },
      });

      return NextResponse.json({
        success: true,
        message: "Face registered successfully",
        data: newProfile,
        meta: null,
        errors: null,
      }, { status: 201 });
    } catch (err: unknown) {
      const error = err as Error;
      logger.error("Error registering face profile", error);
      return NextResponse.json(
        { success: false, message: error.message || "Failed to register face", data: null, meta: null, errors: { global: [error.message] } },
        { status: 500 }
      );
    }
  });
}

export async function GET(req: NextRequest) {
  return logger.track("GET /api/faces/register", async () => {
    try {
      const session = await getSession();
      if (!session || !session.organizationId) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }

      const employeeId = req.nextUrl.searchParams.get("employeeId");
      if (!employeeId) {
        return NextResponse.json({ error: "employeeId is required" }, { status: 400 });
      }

      const [profile] = await db
        .select()
        .from(faceProfiles)
        .where(
          and(
            eq(faceProfiles.employeeId, employeeId),
            eq(faceProfiles.organizationId, session.organizationId)
          )
        )
        .limit(1);

      if (!profile) {
        return NextResponse.json({ error: "Face profile not found" }, { status: 404 });
      }

      return NextResponse.json({
        success: true,
        message: "Face profile retrieved",
        data: profile,
        meta: null,
        errors: null,
      });
    } catch (error) {
      console.error("Error fetching face profile:", error);
      return NextResponse.json({ error: "Failed to fetch face profile" }, { status: 500 });
    }
  });
}

export async function DELETE(req: NextRequest) {
  return logger.track("DELETE /api/faces/register", async () => {
    try {
      const session = await getSession();
      if (!session || !session.organizationId) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }

      const employeeId = req.nextUrl.searchParams.get("employeeId");
      if (!employeeId) {
        return NextResponse.json({ error: "employeeId is required" }, { status: 400 });
      }

      await db
        .delete(faceProfiles)
        .where(
          and(
            eq(faceProfiles.employeeId, employeeId),
            eq(faceProfiles.organizationId, session.organizationId)
          )
        );

      // Audit Log
      await AuditService.log({
        organizationId: session.organizationId,
        userId: session.userId,
        action: "delete_biometrics",
        entity: "employee",
        entityId: employeeId,
      });

      return NextResponse.json({
        success: true,
        message: "Face profile deleted successfully",
        data: null,
        meta: null,
        errors: null,
      });
    } catch (error) {
      console.error("Error deleting face profile:", error);
      return NextResponse.json({ error: "Failed to delete face profile" }, { status: 500 });
    }
  });
}
