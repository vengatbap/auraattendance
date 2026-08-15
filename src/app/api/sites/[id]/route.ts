import { NextRequest } from "next/server";
import { getSession } from "@/lib/auth";
import { siteService } from "@/modules/sites/service/site.service";
import { logger } from "@/lib/logger";
import { PermissionService } from "@/lib/rbac";
import { createApiResponse } from "@/lib/api-response";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  return logger.track(`GET /api/sites/${id}`, async () => {
    try {
      const session = await getSession();
      if (!session || !session.organizationId) {
        return createApiResponse({
          success: false,
          message: "Unauthorized",
          status: 401,
        });
      }

      if (PermissionService.cannot(session, "site.read")) {
        return createApiResponse({
          success: false,
          message: "Forbidden: insufficient permissions",
          status: 403,
        });
      }

      const site = await siteService.getById(id, session.organizationId);

      return createApiResponse({
        success: true,
        message: "Site retrieved successfully",
        data: site,
      });
    } catch (err: unknown) {
      const error = err as Error;
      logger.error(`Failed to get site ${id}`, error);
      return createApiResponse({
        success: false,
        message: error.message || "Failed to retrieve site",
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
  return logger.track(`PUT /api/sites/${id}`, async () => {
    try {
      const session = await getSession();
      if (!session || !session.organizationId) {
        return createApiResponse({
          success: false,
          message: "Unauthorized",
          status: 401,
        });
      }

      if (PermissionService.cannot(session, "site.update")) {
        return createApiResponse({
          success: false,
          message: "Forbidden: insufficient permissions",
          status: 403,
        });
      }

      const body = await req.json();
      const updated = await siteService.update(id, session.organizationId, body, session.userId);

      return createApiResponse({
        success: true,
        message: "Site updated successfully",
        data: updated,
      });
    } catch (err: unknown) {
      const error = err as Error;
      logger.error(`Failed to update site ${id}`, error);
      return createApiResponse({
        success: false,
        message: error.message || "Failed to update site",
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
  return logger.track(`DELETE /api/sites/${id}`, async () => {
    try {
      const session = await getSession();
      if (!session || !session.organizationId) {
        return createApiResponse({
          success: false,
          message: "Unauthorized",
          status: 401,
        });
      }

      if (PermissionService.cannot(session, "site.archive")) {
        return createApiResponse({
          success: false,
          message: "Forbidden: insufficient permissions",
          status: 403,
        });
      }

      await siteService.delete(id, session.organizationId, session.userId);

      return createApiResponse({
        success: true,
        message: "Site deleted successfully",
      });
    } catch (err: unknown) {
      const error = err as Error;
      logger.error(`Failed to delete site ${id}`, error);
      return createApiResponse({
        success: false,
        message: error.message || "Failed to delete site",
        status: 400,
      });
    }
  });
}
