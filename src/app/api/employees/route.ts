import { NextRequest } from "next/server";
import { getSession, getTenantId } from "@/lib/auth";
import { employeeService } from "@/modules/employees/service/employee.service";
import { logger } from "@/lib/logger";
import { PermissionService } from "@/lib/rbac";
import { createApiResponse } from "@/lib/api-response";

export async function GET() {
  return logger.track("GET /api/employees", async () => {
    try {
      const session = await getSession();
      const orgId = getTenantId(session);
      if (!session || !orgId) {
        return createApiResponse({
          success: false,
          message: "Unauthorized",
          status: 401,
        });
      }

      if (PermissionService.cannot(session, "employee.read")) {
        return createApiResponse({
          success: false,
          message: "Forbidden: insufficient permissions",
          status: 403,
        });
      }

      const list = await employeeService.list(orgId);

      return createApiResponse({
        success: true,
        message: "Employees retrieved successfully",
        data: list,
      });
    } catch (err: unknown) {
      const error = err as Error;
      logger.error("Failed to list employees", error);
      return createApiResponse({
        success: false,
        message: error.message || "Failed to retrieve employees",
        status: 500,
      });
    }
  });
}

export async function POST(req: NextRequest) {
  return logger.track("POST /api/employees", async () => {
    try {
      const session = await getSession();
      const orgId = getTenantId(session);
      if (!session || !orgId) {
        return createApiResponse({
          success: false,
          message: "Unauthorized",
          status: 401,
        });
      }

      if (PermissionService.cannot(session, "employee.create")) {
        return createApiResponse({
          success: false,
          message: "Forbidden: insufficient permissions",
          status: 403,
        });
      }

      const body = await req.json();
      const newEmployee = await employeeService.create(orgId, body, session.userId);

      return createApiResponse({
        success: true,
        message: "Employee created successfully",
        data: newEmployee,
      });
    } catch (err: unknown) {
      const error = err as Error;
      logger.error("Failed to create employee", error);
      return createApiResponse({
        success: false,
        message: error.message || "Failed to create employee",
        status: 400,
      });
    }
  });
}
