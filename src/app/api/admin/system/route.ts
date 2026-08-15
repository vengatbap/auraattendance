import { getSession } from "@/lib/auth";
import { PermissionService } from "@/lib/rbac";
import { createApiResponse } from "@/lib/api-response";
import { SystemHealthService } from "@/modules/platform/system/service/system-health.service";

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

    const report = await SystemHealthService.getHealthReport();

    return createApiResponse({
      success: true,
      message: "System health metrics retrieved successfully",
      data: report,
    });
  } catch (error) {
    console.error("System health check API failed:", error);
    return createApiResponse({
      success: false,
      message: "Failed to retrieve system health metrics",
      status: 500,
    });
  }
}
