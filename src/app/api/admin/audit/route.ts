import { getSession } from "@/lib/auth";
import { db } from "@/db";
import { auditLogs, organizations, users } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
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
    if (PermissionService.cannot(session, "platform.system.read")) {
      return createApiResponse({
        success: false,
        message: "Forbidden: insufficient permissions",
        status: 403,
      });
    }

    const logs = await db
      .select({
        id: auditLogs.id,
        action: auditLogs.action,
        entity: auditLogs.entity,
        entityId: auditLogs.entityId,
        details: auditLogs.details,
        createdAt: auditLogs.createdAt,
        organizationName: organizations.name,
        userEmail: users.email,
      })
      .from(auditLogs)
      .leftJoin(organizations, eq(auditLogs.organizationId, organizations.id))
      .leftJoin(users, eq(auditLogs.userId, users.id))
      .orderBy(desc(auditLogs.createdAt))
      .limit(100);

    return createApiResponse({
      success: true,
      message: "Platform audit logs retrieved successfully",
      data: logs,
    });
  } catch (error) {
    console.error("Failed to fetch platform audit logs:", error);
    return createApiResponse({
      success: false,
      message: "Failed to fetch platform audit logs",
      status: 500,
    });
  }
}
