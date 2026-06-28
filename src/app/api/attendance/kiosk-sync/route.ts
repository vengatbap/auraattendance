import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { organizations, employees, faceProfiles, sites } from "@/db/schema";
import { and, eq } from "drizzle-orm";
import { logger } from "@/lib/logger";

export async function GET(req: NextRequest) {
  return logger.track("GET /api/attendance/kiosk-sync", async () => {
    try {
      const { searchParams } = new URL(req.url);
      let orgId = searchParams.get("organizationId");
      const orgSlug = searchParams.get("org");

      if (!orgId && orgSlug) {
        const [org] = await db
          .select()
          .from(organizations)
          .where(eq(organizations.slug, orgSlug))
          .limit(1);
        if (org) orgId = org.id;
      }

      if (!orgId) {
        return NextResponse.json(
          {
            success: false,
            message: "Organization parameter is required",
            data: null,
          },
          { status: 400 }
        );
      }

      // Fetch active employees with face embeddings
      const profiles = await db
        .select({
          employeeId: faceProfiles.employeeId,
          embedding: faceProfiles.embedding,
          name: employees.name,
          employeeCode: employees.employeeCode,
        })
        .from(faceProfiles)
        .innerJoin(employees, eq(faceProfiles.employeeId, employees.id))
        .where(
          and(
            eq(faceProfiles.organizationId, orgId),
            eq(employees.status, "active")
          )
        );

      // Fetch organization settings
      const [config] = await db
        .select({
          id: organizations.id,
          name: organizations.name,
          allowMultiplePunches: organizations.allowMultiplePunches,
          minimumPunchGapMinutes: organizations.minimumPunchGapMinutes,
          autoCheckout: organizations.autoCheckout,
          autoCheckoutTime: organizations.autoCheckoutTime,
          gracePeriodMinutes: organizations.gracePeriodMinutes,
          lateAfterTime: organizations.lateAfterTime,
          faceMatchThreshold: organizations.faceMatchThreshold,
        })
        .from(organizations)
        .where(eq(organizations.id, orgId))
        .limit(1);

      // Fetch active sites
      const activeSites = await db
        .select({
          id: sites.id,
          name: sites.name,
          latitude: sites.latitude,
          longitude: sites.longitude,
          radius: sites.radius,
        })
        .from(sites)
        .where(
          and(
            eq(sites.organizationId, orgId),
            eq(sites.status, "active")
          )
        );

      return NextResponse.json({
        success: true,
        message: "Kiosk data retrieved successfully",
        data: {
          profiles,
          config,
          sites: activeSites,
        },
      });
    } catch (err: unknown) {
      const error = err as Error;
      logger.error("Failed to sync kiosk data", error);
      return NextResponse.json(
        {
          success: false,
          message: error.message || "Failed to sync kiosk data",
          data: null,
        },
        { status: 500 }
      );
    }
  });
}
