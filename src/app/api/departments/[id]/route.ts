import { NextRequest } from "next/server";
import { getSession } from "@/lib/auth";
import { departmentService } from "@/modules/departments/service/department.service";
import { logger } from "@/lib/logger";
import { PermissionService } from "@/lib/rbac";
import { createApiResponse } from "@/lib/api-response";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  return logger.track(`GET /api/departments/${id}`, async () => {
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

      const dept = await departmentService.getById(id, session.organizationId);

      return createApiResponse({
        success: true,
        message: "Department retrieved successfully",
        data: dept,
      });
    } catch (err: unknown) {
      const error = err as Error;
      logger.error(`Failed to get department ${id}`, error);
      return createApiResponse({
        success: false,
        message: error.message || "Failed to retrieve department",
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
  return logger.track(`PUT /api/departments/${id}`, async () => {
    try {
      const session = await getSession();
      if (!session || !session.organizationId) {
        return createApiResponse({
          success: false,
          message: "Unauthorized",
          status: 401,
        });
      }

      if (PermissionService.cannot(session, "department.update")) {
        return createApiResponse({
          success: false,
          message: "Forbidden: insufficient permissions",
          status: 403,
        });
      }

      const body = await req.json();
      const updated = await departmentService.update(id, session.organizationId, body, session.userId);

      return createApiResponse({
        success: true,
        message: "Department updated successfully",
        data: updated,
      });
    } catch (err: unknown) {
      const error = err as Error;
      logger.error(`Failed to update department ${id}`, error);
      return createApiResponse({
        success: false,
        message: error.message || "Failed to update department",
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
  return logger.track(`DELETE /api/departments/${id}`, async () => {
    try {
      const session = await getSession();
      if (!session || !session.organizationId) {
        return createApiResponse({
          success: false,
          message: "Unauthorized",
          status: 401,
        });
      }

      if (PermissionService.cannot(session, "department.archive")) {
        return createApiResponse({
          success: false,
          message: "Forbidden: insufficient permissions",
          status: 403,
        });
      }

      await departmentService.delete(id, session.organizationId, session.userId);

      return createApiResponse({
        success: true,
        message: "Department deleted successfully",
      });
    } catch (err: unknown) {
      const error = err as Error;
      logger.error(`Failed to delete department ${id}`, error);
      return createApiResponse({
        success: false,
        message: error.message || "Failed to delete department",
        status: 400,
      });
    }
  });
}
