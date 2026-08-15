import { getSession } from "@/lib/auth";
import { db } from "@/db";
import { users, organizations } from "@/db/schema";
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
    if (PermissionService.cannot(session, "platform.users.read")) {
      return createApiResponse({
        success: false,
        message: "Forbidden: insufficient permissions",
        status: 403,
      });
    }

    // Fetch only platform users (users registered in our login portal)
    const allUsers = await db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        role: users.role,
        createdAt: users.createdAt,
        organizationName: organizations.name,
      })
      .from(users)
      .leftJoin(organizations, eq(users.organizationId, organizations.id))
      .orderBy(desc(users.createdAt));

    return createApiResponse({
      success: true,
      message: "Platform users retrieved successfully",
      data: allUsers,
    });
  } catch (error) {
    console.error("Failed to fetch platform users:", error);
    return createApiResponse({
      success: false,
      message: "Failed to fetch platform users",
      status: 500,
    });
  }
}
