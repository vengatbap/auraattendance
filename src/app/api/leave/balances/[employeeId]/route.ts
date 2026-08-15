import { NextRequest } from "next/server";
import { getSession } from "@/lib/auth";
import { LeaveBalanceService } from "@/modules/leave/service/leave-balance.service";
import { logger } from "@/lib/logger";
import { PermissionService } from "@/lib/rbac";
import { createApiResponse } from "@/lib/api-response";
import { AppError } from "@/lib/errors";

export async function GET(req: NextRequest, { params }: { params: Promise<{ employeeId: string }> }) {
  const resolvedParams = await params;
  return logger.track(`GET /api/leave/balances/${resolvedParams.employeeId}`, async () => {
    try {
      const session = await getSession();
      if (!session || !session.organizationId) {
        return createApiResponse({ success: false, message: "Unauthorized", status: 401 });
      }

      if (PermissionService.cannot(session, "leave.read")) {
        return createApiResponse({ success: false, message: "Forbidden", status: 403 });
      }

      const { searchParams } = new URL(req.url);
      // Determine year, default to current year
      const year = searchParams.has("year") ? parseInt(searchParams.get("year")!) : new Date().getFullYear();

      const balances = await LeaveBalanceService.getEmployeeBalances(session.organizationId, resolvedParams.employeeId, year);

      return createApiResponse({
        success: true,
        message: "Leave balances retrieved successfully",
        data: balances,
      });
    } catch (err: unknown) {
      logger.error(`Failed to get leave balances for ${resolvedParams.employeeId}`, err);
      return createApiResponse({
        success: false,
        message: (err as Error).message || "Failed to retrieve leave balances",
        status: err instanceof AppError ? err.statusCode : 500,
        errors: { code: err instanceof AppError ? err.code : "INTERNAL_SERVER_ERROR" },
      });
    }
  });
}
