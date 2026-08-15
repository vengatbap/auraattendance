import { NextRequest } from "next/server";
import { getSession } from "@/lib/auth";
import { LeavePolicyService } from "@/modules/leave/service/leave-policy.service";
import { logger } from "@/lib/logger";
import { PermissionService } from "@/lib/rbac";
import { createApiResponse } from "@/lib/api-response";
import { z } from "zod";
import { AppError } from "@/lib/errors";

const updateLeaveTypeSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  description: z.string().optional(),
  isPaid: z.boolean().optional(),
  annualAllowance: z.number().min(0).optional(),
  carryForwardAllowed: z.boolean().optional(),
  maxCarryForward: z.number().min(0).optional(),
  requiresApproval: z.boolean().optional(),
  requiresAttachment: z.boolean().optional(),
  status: z.string().max(50).optional(),
});

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  return logger.track(`GET /api/leave/types/${resolvedParams.id}`, async () => {
    try {
      const session = await getSession();
      if (!session || !session.organizationId) {
        return createApiResponse({ success: false, message: "Unauthorized", status: 401 });
      }

      if (PermissionService.cannot(session, "leave.read")) {
        return createApiResponse({ success: false, message: "Forbidden", status: 403 });
      }

      const type = await LeavePolicyService.getType(resolvedParams.id, session.organizationId);
      if (!type) {
        return createApiResponse({ success: false, message: "Leave type not found", status: 404, errors: { code: "LEAVE_TYPE_NOT_FOUND" } });
      }

      return createApiResponse({
        success: true,
        message: "Leave type retrieved successfully",
        data: type,
      });
    } catch (err: unknown) {
      logger.error(`Failed to get leave type ${resolvedParams.id}`, err);
      return createApiResponse({
        success: false,
        message: (err as Error).message || "Failed to retrieve leave type",
        status: err instanceof AppError ? err.statusCode : 500,
        errors: { code: err instanceof AppError ? err.code : "INTERNAL_SERVER_ERROR" },
      });
    }
  });
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  return logger.track(`PATCH /api/leave/types/${resolvedParams.id}`, async () => {
    try {
      const session = await getSession();
      if (!session || !session.organizationId) {
        return createApiResponse({ success: false, message: "Unauthorized", status: 401 });
      }

      if (PermissionService.cannot(session, "leave.manage_types")) {
        return createApiResponse({ success: false, message: "Forbidden", status: 403 });
      }

      const body = await req.json();
      const parsed = updateLeaveTypeSchema.parse(body);

      const updatedType = await LeavePolicyService.updateType(resolvedParams.id, session.organizationId, {
        ...parsed,
        updatedBy: session.userId,
      });

      if (!updatedType) {
         return createApiResponse({ success: false, message: "Leave type not found", status: 404, errors: { code: "LEAVE_TYPE_NOT_FOUND" } });
      }

      return createApiResponse({
        success: true,
        message: "Leave type updated successfully",
        data: updatedType,
      });
    } catch (err: unknown) {
      logger.error(`Failed to update leave type ${resolvedParams.id}`, err);
      return createApiResponse({
        success: false,
        message: (err as Error).message || "Failed to update leave type",
        status: err instanceof z.ZodError ? 400 : (err instanceof AppError ? err.statusCode : 500),
        errors: { code: err instanceof AppError ? err.code : "INTERNAL_SERVER_ERROR" },
      });
    }
  });
}
