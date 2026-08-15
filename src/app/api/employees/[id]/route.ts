import { NextRequest } from "next/server";
import { getSession } from "@/lib/auth";
import { employeeService } from "@/modules/employees/service/employee.service";
import { logger } from "@/lib/logger";
import { PermissionService } from "@/lib/rbac";
import { createApiResponse } from "@/lib/api-response";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  return logger.track(`GET /api/employees/${id}`, async () => {
    try {
      const session = await getSession();
      if (!session || !session.organizationId) {
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

      const employee = await employeeService.getById(id, session.organizationId);

      return createApiResponse({
        success: true,
        message: "Employee retrieved successfully",
        data: employee,
      });
    } catch (err: unknown) {
      const error = err as Error;
      logger.error(`Failed to get employee ${id}`, error);
      return createApiResponse({
        success: false,
        message: error.message || "Failed to retrieve employee",
        status: 404,
      });
    }
  });
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  return logger.track(`PUT /api/employees/${id}`, async () => {
    try {
      const session = await getSession();
      if (!session || !session.organizationId) {
        return createApiResponse({
          success: false,
          message: "Unauthorized",
          status: 401,
        });
      }

      if (PermissionService.cannot(session, "employee.update")) {
        return createApiResponse({
          success: false,
          message: "Forbidden: insufficient permissions",
          status: 403,
        });
      }

      const body = await req.json();
      const updated = await employeeService.update(id, session.organizationId, body, session.userId);

      return createApiResponse({
        success: true,
        message: "Employee updated successfully",
        data: updated,
      });
    } catch (err: unknown) {
      const error = err as Error;
      logger.error(`Failed to update employee ${id}`, error);
      return createApiResponse({
        success: false,
        message: error.message || "Failed to update employee",
        status: 400,
      });
    }
  });
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  return logger.track(`DELETE /api/employees/${id}`, async () => {
    try {
      const session = await getSession();
      if (!session || !session.organizationId) {
        return createApiResponse({
          success: false,
          message: "Unauthorized",
          status: 401,
        });
      }

      if (PermissionService.cannot(session, "employee.archive")) {
        return createApiResponse({
          success: false,
          message: "Forbidden: insufficient permissions",
          status: 403,
        });
      }

      await employeeService.delete(id, session.organizationId, session.userId);

      return createApiResponse({
        success: true,
        message: "Employee deleted successfully",
      });
    } catch (err: unknown) {
      const error = err as Error;
      logger.error(`Failed to delete employee ${id}`, error);
      return createApiResponse({
        success: false,
        message: error.message || "Failed to delete employee",
        status: 400,
      });
    }
  });
}
