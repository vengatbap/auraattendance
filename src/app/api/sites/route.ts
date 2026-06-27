import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { siteService } from "@/modules/sites/service/site.service";
import { logger } from "@/lib/logger";
import { db } from "@/db";
import { organizations, sites } from "@/db/schema";
import { and, eq, isNull } from "drizzle-orm";
import { mapToSiteDTO, SiteEntity } from "@/modules/sites/types";

export async function GET(req: Request) {
  return logger.track("GET /api/sites", async () => {
    try {
      const session = await getSession();
      const { searchParams } = new URL(req.url);
      const orgSlug = searchParams.get("org");
      const orgId = searchParams.get("organizationId");

      let organizationId = session?.organizationId ?? null;

      if (!organizationId) {
        // Public request (e.g. from kiosk)
        if (orgSlug) {
          const [org] = await db
            .select()
            .from(organizations)
            .where(eq(organizations.slug, orgSlug))
            .limit(1);
          if (org) {
            organizationId = org.id;
          }
        } else if (orgId) {
          organizationId = orgId;
        }
      }

      if (organizationId) {
        const list = await siteService.list(organizationId);
        return NextResponse.json({
          success: true,
          message: "Sites retrieved successfully",
          data: list,
          meta: null,
          errors: null,
        });
      }

      // Backward compatibility fallback - list all active sites
      const allActive = await db
        .select()
        .from(sites)
        .where(and(eq(sites.status, "active"), isNull(sites.deletedAt)));
      return NextResponse.json({
        success: true,
        message: "Active sites retrieved globally",
        data: allActive.map((s) => mapToSiteDTO(s as unknown as SiteEntity)),
        meta: null,
        errors: null,
      });
    } catch (err: unknown) {
      const error = err as Error;
      logger.error("Failed to list sites", error);
      return NextResponse.json(
        {
          success: false,
          message: error.message || "Failed to retrieve sites",
          data: null,
          meta: null,
          errors: { global: ["Failed to list sites"] },
        },
        { status: 500 }
      );
    }
  });
}

export async function POST(req: Request) {
  return logger.track("POST /api/sites", async () => {
    try {
      const session = await getSession();
      if (!session || !session.organizationId) {
        return NextResponse.json(
          { success: false, message: "Unauthorized", data: null, meta: null, errors: { global: ["Authentication required"] } },
          { status: 401 }
        );
      }

      const body = await req.json();
      const site = await siteService.create(session.organizationId, body, session.userId);

      return NextResponse.json({
        success: true,
        message: "Site created successfully",
        data: site,
        meta: null,
        errors: null,
      });
    } catch (err: unknown) {
      const error = err as Error;
      logger.error("Failed to create site", error);
      return NextResponse.json(
        {
          success: false,
          message: error.message || "Failed to create site",
          data: null,
          meta: null,
          errors: { global: [error.message] },
        },
        { status: 400 }
      );
    }
  });
}
