import { NextRequest } from "next/server";
import { getSession } from "@/lib/auth";
import { LeaveService } from "@/modules/leave/service/leave.service";
import { logger } from "@/lib/logger";
import { PermissionService } from "@/lib/rbac";
import { createApiResponse } from "@/lib/api-response";
import { AppError } from "@/lib/errors";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  return logger.track(`POST /api/leave/requests/${resolvedParams.id}/cancel`, async () => {
    try {
      const session = await getSession();
      if (!session || !session.organizationId) {
        return createApiResponse({ success: false, message: "Unauthorized", status: 401 });
      }

      if (PermissionService.cannot(session, "leave.cancel")) {
        return createApiResponse({ success: false, message: "Forbidden", status: 403 });
      }

      const request = await LeaveService.cancelRequest(session.organizationId, resolvedParams.id, session.userId);

      return createApiResponse({
        success: true,
        message: "Leave request cancelled successfully",
        data: request,
      });
    } catch (err: unknown) {
      logger.error(`Failed to cancel leave request ${resolvedParams.id}`, err);
      return createApiResponse({
        success: false,
        message: (err as Error).message || "Failed to cancel leave request",
        status: err instanceof AppError ? err.statusCode : 500,
        errors: { code: err instanceof AppError ? err.code : "INTERNAL_SERVER_ERROR" },
      });
    }
  });
}
