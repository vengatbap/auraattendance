import { NextRequest } from "next/server";
import { getSession } from "@/lib/auth";
import { LeaveRequestRepository } from "@/modules/leave/repository/leave-request.repository";
import { logger } from "@/lib/logger";
import { PermissionService } from "@/lib/rbac";
import { createApiResponse } from "@/lib/api-response";
import { AppError } from "@/lib/errors";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  return logger.track(`GET /api/leave/requests/${resolvedParams.id}`, async () => {
    try {
      const session = await getSession();
      if (!session || !session.organizationId) {
        return createApiResponse({ success: false, message: "Unauthorized", status: 401 });
      }

      if (PermissionService.cannot(session, "leave.read")) {
        return createApiResponse({ success: false, message: "Forbidden", status: 403 });
      }

      const request = await LeaveRequestRepository.findById(resolvedParams.id, session.organizationId);
      if (!request) {
        return createApiResponse({ success: false, message: "Leave request not found", status: 404, errors: { code: "LEAVE_REQUEST_NOT_FOUND" } });
      }

      return createApiResponse({
        success: true,
        message: "Leave request retrieved successfully",
        data: request,
      });
    } catch (err: unknown) {
      logger.error(`Failed to get leave request ${resolvedParams.id}`, err);
      return createApiResponse({
        success: false,
        message: (err as Error).message || "Failed to retrieve leave request",
        status: err instanceof AppError ? err.statusCode : 500,
        errors: { code: err instanceof AppError ? err.code : "INTERNAL_SERVER_ERROR" },
      });
    }
  });
}
