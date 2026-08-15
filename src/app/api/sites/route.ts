import { getSession } from "@/lib/auth";
import { siteService } from "@/modules/sites/service/site.service";
import { logger } from "@/lib/logger";
import { db } from "@/db";
import { organizations } from "@/db/schema";
import { eq } from "drizzle-orm";
import { PermissionService } from "@/lib/rbac";
import { createApiResponse } from "@/lib/api-response";

export async function GET(req: Request) {
  return logger.track("GET /api/sites", async () => {
    try {
      const session = await getSession();
      const { searchParams } = new URL(req.url);
      const orgSlug = searchParams.get("org");
      const orgId = searchParams.get("organizationId");

      let organizationId = session?.organizationId ?? null;

      // Allow public request (e.g. from kiosk) ONLY if a valid organization slug/id context is provided
      if (!organizationId) {
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

      if (!organizationId) {
        return createApiResponse({
          success: false,
          message: "Organization identifier is required.",
          status: 400,
        });
      }

      // If they have a session, enforce active permission checks
      if (session && PermissionService.cannot(session, "site.read")) {
        return createApiResponse({
          success: false,
          message: "Forbidden: insufficient permissions",
          status: 403,
        });
      }

      const list = await siteService.list(organizationId);
      return createApiResponse({
        success: true,
        message: "Sites retrieved successfully",
        data: list,
      });
    } catch (err: unknown) {
      const error = err as Error;
      logger.error("Failed to list sites", error);
      return createApiResponse({
        success: false,
        message: error.message || "Failed to retrieve sites",
        status: 500,
      });
    }
  });
}

export async function POST(req: Request) {
  return logger.track("POST /api/sites", async () => {
    try {
      const session = await getSession();
      if (!session || !session.organizationId) {
        return createApiResponse({
          success: false,
          message: "Unauthorized",
          status: 401,
        });
      }

      if (PermissionService.cannot(session, "site.create")) {
        return createApiResponse({
          success: false,
          message: "Forbidden: insufficient permissions",
          status: 403,
        });
      }

      const body = await req.json();
      const site = await siteService.create(session.organizationId, body, session.userId);

      return createApiResponse({
        success: true,
        message: "Site created successfully",
        data: site,
      });
    } catch (err: unknown) {
      const error = err as Error;
      logger.error("Failed to create site", error);
      return createApiResponse({
        success: false,
        message: error.message || "Failed to create site",
        status: 400,
      });
    }
  });
}
