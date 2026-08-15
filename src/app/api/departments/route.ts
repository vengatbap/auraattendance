import { getSession } from "@/lib/auth";
import { departmentService } from "@/modules/departments/service/department.service";
import { logger } from "@/lib/logger";
import { PermissionService } from "@/lib/rbac";
import { createApiResponse } from "@/lib/api-response";

export async function GET() {
  return logger.track("GET /api/departments", async () => {
    try {
      const session = await getSession();
      if (!session || !session.organizationId) {
        return createApiResponse({
          success: false,
          message: "Unauthorized",
          status: 401,
        });
      }

      if (PermissionService.cannot(session, "department.read")) {
        return createApiResponse({
          success: false,
          message: "Forbidden: insufficient permissions",
          status: 403,
        });
      }

      const list = await departmentService.list(session.organizationId);
      return createApiResponse({
        success: true,
        message: "Departments retrieved successfully",
        data: list,
      });
    } catch (err: unknown) {
      const error = err as Error;
      logger.error("Failed to list departments", error);
      return createApiResponse({
        success: false,
        message: error.message || "Failed to retrieve departments",
        status: 500,
      });
    }
  });
}

export async function POST(req: Request) {
  return logger.track("POST /api/departments", async () => {
    try {
      const session = await getSession();
      if (!session || !session.organizationId) {
        return createApiResponse({
          success: false,
          message: "Unauthorized",
          status: 401,
        });
      }

      if (PermissionService.cannot(session, "department.create")) {
        return createApiResponse({
          success: false,
          message: "Forbidden: insufficient permissions",
          status: 403,
        });
      }

      const body = await req.json();
      const newDept = await departmentService.create(session.organizationId, body, session.userId);

      return createApiResponse({
        success: true,
        message: "Department created successfully",
        data: newDept,
      });
    } catch (err: unknown) {
      const error = err as Error;
      logger.error("Failed to create department", error);
      return createApiResponse({
        success: false,
        message: error.message || "Failed to create department",
        status: 400,
      });
    }
  });
}
