import { NextRequest } from "next/server";
import { getSession } from "@/lib/auth";
import { LeaveService } from "@/modules/leave/service/leave.service";
import { logger } from "@/lib/logger";
import { PermissionService } from "@/lib/rbac";
import { createApiResponse } from "@/lib/api-response";
import { z } from "zod";
import { AppError } from "@/lib/errors";

const rejectLeaveRequestSchema = z.object({
  reason: z.string().min(1, "Rejection reason is required"),
});

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  return logger.track(`POST /api/leave/requests/${resolvedParams.id}/reject`, async () => {
    try {
      const session = await getSession();
      if (!session || !session.organizationId) {
        return createApiResponse({ success: false, message: "Unauthorized", status: 401 });
      }

      if (PermissionService.cannot(session, "leave.reject")) {
        return createApiResponse({ success: false, message: "Forbidden", status: 403 });
      }

      const body = await req.json();
      const parsed = rejectLeaveRequestSchema.parse(body);

      const request = await LeaveService.rejectRequest(session.organizationId, resolvedParams.id, session.userId, parsed.reason);

      return createApiResponse({
        success: true,
        message: "Leave request rejected successfully",
        data: request,
      });
    } catch (err: unknown) {
      logger.error(`Failed to reject leave request ${resolvedParams.id}`, err);
      return createApiResponse({
        success: false,
        message: (err as Error).message || "Failed to reject leave request",
        status: err instanceof z.ZodError ? 400 : (err instanceof AppError ? err.statusCode : 500),
        errors: { code: err instanceof AppError ? err.code : "INTERNAL_SERVER_ERROR" },
      });
    }
  });
}
