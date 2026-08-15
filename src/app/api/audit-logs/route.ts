import { NextRequest } from "next/server";
import { db } from "@/db";
import { auditLogs } from "@/db/schema";
import { desc, eq } from "drizzle-orm";
import { getSession } from "@/lib/auth";
import { PermissionService } from "@/lib/rbac";
import { createApiResponse } from "@/lib/api-response";

export async function GET(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session || !session.organizationId) {
      return createApiResponse({
        success: false,
        message: "Unauthorized",
        status: 401,
      });
    }

    // RBAC Authorization check
    if (PermissionService.cannot(session, "user.read")) {
      return createApiResponse({
        success: false,
        message: "Forbidden: insufficient permissions",
        status: 403,
      });
    }

    const limit = parseInt(req.nextUrl.searchParams.get("limit") || "100");
    const offset = parseInt(req.nextUrl.searchParams.get("offset") || "0");

    const logs = await db
      .select()
      .from(auditLogs)
      .where(eq(auditLogs.organizationId, session.organizationId))
      .orderBy(desc(auditLogs.createdAt))
      .limit(limit)
      .offset(offset);

    return createApiResponse({
      success: true,
      message: "Audit logs fetched successfully",
      data: logs,
    });
  } catch (error) {
    console.error("Failed to fetch audit logs:", error);
    return createApiResponse({
      success: false,
      message: "Failed to fetch audit logs",
      status: 500,
    });
  }
}
