import { NextRequest } from "next/server";
import { getSession } from "@/lib/auth";
import { db } from "@/db";
import { organizations } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { PermissionService } from "@/lib/rbac";
import { createApiResponse } from "@/lib/api-response";
import { AuditService } from "@/modules/audit/service/audit.service";

export async function GET(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return createApiResponse({
        success: false,
        message: "Unauthorized",
        status: 401,
      });
    }

    // RBAC Authorization check
    if (PermissionService.cannot(session, "platform.organizations.read")) {
      return createApiResponse({
        success: false,
        message: "Forbidden: insufficient permissions",
        status: 403,
      });
    }

    const { searchParams } = new URL(req.url);
    const orgId = searchParams.get("organizationId");

    if (!orgId) {
      return createApiResponse({
        success: false,
        message: "Organization ID is required",
        status: 400,
      });
    }

    const [org] = await db
      .select({ featureFlags: organizations.featureFlags })
      .from(organizations)
      .where(eq(organizations.id, orgId))
      .limit(1);

    if (!org) {
      return createApiResponse({
        success: false,
        message: "Organization not found",
        status: 404,
      });
    }

    return createApiResponse({
      success: true,
      message: "Feature flags fetched successfully",
      data: { featureFlags: org.featureFlags },
    });
  } catch (error) {
    console.error("Failed to fetch feature flags:", error);
    return createApiResponse({
      success: false,
      message: "Failed to fetch feature flags",
      status: 500,
    });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return createApiResponse({
        success: false,
        message: "Unauthorized",
        status: 401,
      });
    }

    // RBAC Authorization check
    if (PermissionService.cannot(session, "platform.features.update")) {
      return createApiResponse({
        success: false,
        message: "Forbidden: insufficient permissions",
        status: 403,
      });
    }

    const body = await req.json();
    const { organizationId, featureFlags } = body;

    if (!organizationId || !featureFlags) {
      return createApiResponse({
        success: false,
        message: "Organization ID and feature flags are required",
        status: 400,
      });
    }

    // Fetch original tenant to support optimistic locking
    const [originalOrg] = await db
      .select()
      .from(organizations)
      .where(eq(organizations.id, organizationId))
      .limit(1);

    if (!originalOrg) {
      return createApiResponse({
        success: false,
        message: "Organization not found",
        status: 404,
      });
    }

    const currentVersion = originalOrg.version ?? 1;

    const [updated] = await db
      .update(organizations)
      .set({
        featureFlags,
        updatedAt: new Date(),
        version: currentVersion + 1,
      })
      .where(
        and(
          eq(organizations.id, organizationId),
          eq(organizations.version, currentVersion)
        )
      )
      .returning();

    if (!updated) {
      return createApiResponse({
        success: false,
        message: "Concurrent update detected. The organization features have been modified by another process. Please reload and try again.",
        errors: { code: "CONCURRENCY_CONFLICT" },
        status: 409,
      });
    }

    await AuditService.log({
      organizationId,
      userId: session.userId,
      action: "update_features",
      entity: "organization",
      entityId: organizationId,
      details: { featureFlags },
    });

    return createApiResponse({
      success: true,
      message: "Feature flags updated successfully",
      data: { featureFlags: updated.featureFlags },
    });
  } catch (error) {
    console.error("Error updating feature flags:", error);
    return createApiResponse({
      success: false,
      message: "Failed to update feature flags",
      status: 500,
    });
  }
}
