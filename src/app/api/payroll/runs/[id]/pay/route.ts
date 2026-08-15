import { NextResponse } from "next/server";
import { createApiResponse } from "@/lib/api-response";
import { requireTenantContext } from "@/lib/auth";
import { PermissionService } from "@/modules/permissions/service/permission.service";
import { PayrollService } from "@/modules/payroll/services/payroll.service";
import { AppError } from "@/lib/errors";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireTenantContext();
    if (PermissionService.cannot(user, "payroll.pay")) {
      return createApiResponse({ success: false, message: "Forbidden", status: 403, errors: { code: "FORBIDDEN" } });
    }

    const { id } = await params;
    const run = await PayrollService.payRun(user.organizationId, id, user.userId);

    return createApiResponse({ success: true, message: "Success", data: run });
  } catch (err: unknown) {
    if (err instanceof AppError) {
      return createApiResponse({ success: false, message: (err as Error).message, status: err.statusCode, errors: { code: err.code } });
    }
    return createApiResponse({ success: false, message: "Internal server error", status: 500, errors: { code: "INTERNAL_ERROR" } });
  }
}
