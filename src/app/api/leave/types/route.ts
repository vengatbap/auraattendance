import { NextRequest } from "next/server";
import { getSession } from "@/lib/auth";
import { LeavePolicyService } from "@/modules/leave/service/leave-policy.service";
import { logger } from "@/lib/logger";
import { PermissionService } from "@/lib/rbac";
import { createApiResponse } from "@/lib/api-response";
import { z } from "zod";
import { AppError } from "@/lib/errors";

const createLeaveTypeSchema = z.object({
  code: z.string().min(1).max(50),
  name: z.string().min(1).max(255),
  description: z.string().optional(),
  isPaid: z.boolean().default(true),
  annualAllowance: z.number().min(0).default(0),
  carryForwardAllowed: z.boolean().default(false),
  maxCarryForward: z.number().min(0).default(0),
  requiresApproval: z.boolean().default(true),
  requiresAttachment: z.boolean().default(false),
});

export async function GET() {
  return logger.track("GET /api/leave/types", async () => {
    try {
      const session = await getSession();
      if (!session || !session.organizationId) {
        return createApiResponse({ success: false, message: "Unauthorized", status: 401 });
      }

      if (PermissionService.cannot(session, "leave.read")) {
        return createApiResponse({ success: false, message: "Forbidden", status: 403 });
      }

      const types = await LeavePolicyService.listTypes(session.organizationId);

      return createApiResponse({
        success: true,
        message: "Leave types retrieved successfully",
        data: types,
      });
    } catch (err: unknown) {
      logger.error("Failed to list leave types", err);
      return createApiResponse({
        success: false,
        message: (err as Error).message || "Failed to retrieve leave types",
        status: err instanceof AppError ? err.statusCode : 500,
        errors: { code: err instanceof AppError ? err.code : "INTERNAL_SERVER_ERROR" },
      });
    }
  });
}

export async function POST(req: NextRequest) {
  return logger.track("POST /api/leave/types", async () => {
    try {
      const session = await getSession();
      if (!session || !session.organizationId) {
        return createApiResponse({ success: false, message: "Unauthorized", status: 401 });
      }

      if (PermissionService.cannot(session, "leave.manage_types")) {
        return createApiResponse({ success: false, message: "Forbidden", status: 403 });
      }

      const body = await req.json();
      const parsed = createLeaveTypeSchema.parse(body);

      const newType = await LeavePolicyService.createType({
        ...parsed,
        organizationId: session.organizationId,
        createdBy: session.userId,
      });

      return createApiResponse({
        success: true,
        message: "Leave type created successfully",
        data: newType,
      });
    } catch (err: unknown) {
      logger.error("Failed to create leave type", err);
      return createApiResponse({
        success: false,
        message: (err as Error).message || "Failed to create leave type",
        status: err instanceof z.ZodError ? 400 : (err instanceof AppError ? err.statusCode : 500),
        errors: { code: err instanceof AppError ? err.code : "INTERNAL_SERVER_ERROR" },
      });
    }
  });
}

