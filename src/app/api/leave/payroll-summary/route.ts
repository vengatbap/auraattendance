import { NextRequest } from "next/server";
import { getSession } from "@/lib/auth";
import { LeaveService } from "@/modules/leave/service/leave.service";
import { logger } from "@/lib/logger";
import { PermissionService } from "@/lib/rbac";
import { createApiResponse } from "@/lib/api-response";
import { AppError } from "@/lib/errors";

export async function GET(req: NextRequest) {
  return logger.track("GET /api/leave/payroll-summary", async () => {
    try {
      const session = await getSession();
      if (!session || !session.organizationId) {
        return createApiResponse({ success: false, message: "Unauthorized", status: 401 });
      }

      // We might need a special permission for payroll, but for now we use leave.read
      if (PermissionService.cannot(session, "leave.read")) {
        return createApiResponse({ success: false, message: "Forbidden", status: 403 });
      }

      const { searchParams } = new URL(req.url);
      const employeeId = searchParams.get("employeeId");
      const startStr = searchParams.get("startDate");
      const endStr = searchParams.get("endDate");

      if (!employeeId || !startStr || !endStr) {
        return createApiResponse({ success: false, message: "employeeId, startDate, and endDate are required", status: 400 });
      }

      const periodStart = new Date(startStr);
      const periodEnd = new Date(endStr);

      const summary = await LeaveService.getPayrollSummary(
        session.organizationId,
        employeeId,
        periodStart,
        periodEnd
      );

      return createApiResponse({
        success: true,
        message: "Leave payroll summary retrieved successfully",
        data: summary,
      });
    } catch (err: unknown) {
      logger.error("Failed to get leave payroll summary", err);
      return createApiResponse({
        success: false,
        message: (err as Error).message || "Failed to retrieve leave payroll summary",
        status: err instanceof AppError ? err.statusCode : 500,
        errors: { code: err instanceof AppError ? err.code : "INTERNAL_SERVER_ERROR" },
      });
    }
  });
}

