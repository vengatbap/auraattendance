import { NextRequest } from "next/server";
import { getSession } from "@/lib/auth";
import { LeaveService } from "@/modules/leave/service/leave.service";
import { LeaveRequestRepository } from "@/modules/leave/repository/leave-request.repository";
import { logger } from "@/lib/logger";
import { PermissionService } from "@/lib/rbac";
import { createApiResponse } from "@/lib/api-response";
import { z } from "zod";
import { AppError } from "@/lib/errors";

const createLeaveRequestSchema = z.object({
  employeeId: z.string().uuid(),
  leaveTypeId: z.string().uuid(),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format (YYYY-MM-DD)"),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format (YYYY-MM-DD)"),
  requestedDays: z.number().positive(),
  reason: z.string().min(1),
  attachmentUrl: z.string().optional(),
});

export async function GET(req: NextRequest) {
  return logger.track("GET /api/leave/requests", async () => {
    try {
      const session = await getSession();
      if (!session || !session.organizationId) {
        return createApiResponse({ success: false, message: "Unauthorized", status: 401 });
      }

      if (PermissionService.cannot(session, "leave.read")) {
        return createApiResponse({ success: false, message: "Forbidden", status: 403 });
      }

      const { searchParams } = new URL(req.url);
      const employeeId = searchParams.get("employeeId") || undefined;
      const status = searchParams.get("status") || undefined;
      const startDate = searchParams.get("startDate") || undefined;
      const endDate = searchParams.get("endDate") || undefined;

      const requests = await LeaveRequestRepository.list(session.organizationId, {
        employeeId, status, startDate, endDate
      });

      return createApiResponse({
        success: true,
        message: "Leave requests retrieved successfully",
        data: requests,
      });
    } catch (err: unknown) {
      logger.error("Failed to list leave requests", err);
      return createApiResponse({
        success: false,
        message: (err as Error).message || "Failed to retrieve leave requests",
        status: err instanceof AppError ? err.statusCode : 500,
        errors: { code: err instanceof AppError ? err.code : "INTERNAL_SERVER_ERROR" },
      });
    }
  });
}

export async function POST(req: NextRequest) {
  return logger.track("POST /api/leave/requests", async () => {
    try {
      const session = await getSession();
      if (!session || !session.organizationId) {
        return createApiResponse({ success: false, message: "Unauthorized", status: 401 });
      }

      if (PermissionService.cannot(session, "leave.submit") && PermissionService.cannot(session, "leave.create")) {
        return createApiResponse({ success: false, message: "Forbidden", status: 403 });
      }

      const body = await req.json();
      const parsed = createLeaveRequestSchema.parse(body);

      const request = await LeaveService.submitRequest(
        session.organizationId,
        parsed.employeeId,
        parsed.leaveTypeId,
        parsed.startDate,
        parsed.endDate,
        parsed.requestedDays,
        parsed.reason,
        parsed.attachmentUrl
      );

      return createApiResponse({
        success: true,
        message: "Leave request submitted successfully",
        data: request,
      });
    } catch (err: unknown) {
      logger.error("Failed to submit leave request", err);
      return createApiResponse({
        success: false,
        message: (err as Error).message || "Failed to submit leave request",
        status: err instanceof z.ZodError ? 400 : (err instanceof AppError ? err.statusCode : 500),
        errors: { code: err instanceof AppError ? err.code : "INTERNAL_SERVER_ERROR" },
      });
    }
  });
}

