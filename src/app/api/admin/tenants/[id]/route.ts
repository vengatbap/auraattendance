import { NextRequest } from "next/server";
import { getSession } from "@/lib/auth";
import { db } from "@/db";
import { organizations } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { z } from "zod";
import { PermissionService } from "@/lib/rbac";
import { createApiResponse } from "@/lib/api-response";
import { AuditService } from "@/modules/audit/service/audit.service";

const UpdateTenantSchema = z.object({
  status: z.enum(["active", "suspended"]).optional(),
  subscriptionPlan: z.enum(["trial", "standard", "enterprise"]).optional(),
  trialEndsAt: z.string().nullable().optional(),
});

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
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
    if (PermissionService.cannot(session, "platform.organizations.update")) {
      return createApiResponse({
        success: false,
        message: "Forbidden: insufficient permissions",
        status: 403,
      });
    }

    const { id } = await params;
    const body = await req.json();
    const result = UpdateTenantSchema.safeParse(body);

    if (!result.success) {
      return createApiResponse({
        success: false,
        message: "Validation failed",
        errors: result.error.issues,
        status: 400,
      });
    }

    // Fetch original tenant to support optimistic locking
    const [originalTenant] = await db
      .select()
      .from(organizations)
      .where(eq(organizations.id, id))
      .limit(1);

    if (!originalTenant) {
      return createApiResponse({
        success: false,
        message: "Tenant not found",
        status: 404,
      });
    }

    const currentVersion = originalTenant.version ?? 1;

    // Build update parameters
    const updateData: Partial<typeof organizations.$inferInsert> = {
      updatedAt: new Date(),
      version: currentVersion + 1,
    };

    if (result.data.status) updateData.status = result.data.status;
    if (result.data.subscriptionPlan) updateData.subscriptionPlan = result.data.subscriptionPlan;
    if (result.data.trialEndsAt !== undefined) {
      updateData.trialEndsAt = result.data.trialEndsAt ? new Date(result.data.trialEndsAt) : null;
    }

    // Update organization with optimistic locking check
    const [updated] = await db
      .update(organizations)
      .set(updateData)
      .where(
        and(
          eq(organizations.id, id),
          eq(organizations.version, currentVersion)
        )
      )
      .returning();

    if (!updated) {
      return createApiResponse({
        success: false,
        message: "Concurrent update detected. The tenant record has been modified by another process. Please reload and try again.",
        errors: { code: "CONCURRENCY_CONFLICT" },
        status: 409,
      });
    }

    await AuditService.log({
      organizationId: id,
      userId: session.userId,
      action: body.status ? `tenant_${body.status}` : "tenant_plan_updated",
      entity: "organization",
      entityId: id,
      details: body,
    });

    return createApiResponse({
      success: true,
      message: "Tenant updated successfully",
      data: updated,
    });
  } catch (error) {
    console.error("Error updating tenant:", error);
    return createApiResponse({
      success: false,
      message: "Failed to update tenant",
      status: 500,
    });
  }
}
