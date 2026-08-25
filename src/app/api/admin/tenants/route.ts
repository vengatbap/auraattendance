import { getSession } from "@/lib/auth";
import { db } from "@/db";
import { organizations, attendanceLogs } from "@/db/schema";
import { desc, sql } from "drizzle-orm";
import { PermissionService } from "@/lib/rbac";
import { createApiResponse } from "@/lib/api-response";

export async function GET() {
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

    // Query organizations list and dynamically calculate last activity from attendance logs
    const tenants = await db
      .select({
        id: organizations.id,
        name: organizations.name,
        slug: organizations.slug,
        subscriptionPlan: organizations.subscriptionPlan,
        status: organizations.status,
        trialEndsAt: organizations.trialEndsAt,
        createdAt: organizations.createdAt,
        featureFlags: organizations.featureFlags,
        lastActivityAt: sql<string>`COALESCE(
          (SELECT MAX(created_at) FROM ${attendanceLogs} WHERE ${attendanceLogs.organizationId} = ${organizations.id}),
          ${organizations.updatedAt}
        )`,
      })
      .from(organizations)
      .orderBy(desc(organizations.createdAt));

    return createApiResponse({
      success: true,
      message: "Tenants retrieved successfully",
      data: tenants,
    });
  } catch (error) {
    console.error("Failed to fetch tenants:", error);
    return createApiResponse({
      success: false,
      message: "Failed to fetch tenants",
      status: 500,
    });
  }
}
