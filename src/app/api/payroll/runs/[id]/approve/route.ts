/* eslint-disable @typescript-eslint/no-explicit-any */
import { createApiResponse } from "@/lib/api-response";
import { NextRequest, NextResponse } from "next/server";
import { requireTenantContext } from "@/lib/auth";
import { PermissionService } from "@/modules/permissions/service/permission.service";
import { PayrollService } from "@/modules/payroll/services/payroll.service";
import { AppError } from "@/lib/errors";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireTenantContext();
    if (PermissionService.cannot(user, "payroll.approve")) {
      return createApiResponse({ success: false, message: "Forbidden", status: 403, errors: { code: "FORBIDDEN" } });
    }

    const { id } = await params;
    const run = await PayrollService.approveRun(user.organizationId, id, user.userId);

    return createApiResponse({ success: true, message: "Success", data: run });
  } catch (error: unknown) {
    console.error("Approve run error:", error);
    if (error instanceof AppError) {
      return NextResponse.json({ error: { code: (error as any).code, message: (error as any).message } }, { status: (error as any).statusCode });
    }
    return createApiResponse({ success: false, message: "Internal server error", status: 500, errors: { code: "INTERNAL_ERROR" } });
  }
}
