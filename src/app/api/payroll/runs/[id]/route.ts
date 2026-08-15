/* eslint-disable @typescript-eslint/no-explicit-any */
import { createApiResponse } from "@/lib/api-response";
import { NextRequest, NextResponse } from "next/server";
import { requireTenantContext } from "@/lib/auth";
import { PermissionService } from "@/modules/permissions/service/permission.service";
import { PayrollRunRepository } from "@/modules/payroll/repository/payroll-run.repository";
import { PayrollItemRepository } from "@/modules/payroll/repository/payroll-item.repository";
import { AppError } from "@/lib/errors";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireTenantContext();
    if (PermissionService.cannot(user, "payroll.read")) {
      return createApiResponse({ success: false, message: "Forbidden", status: 403, errors: { code: "FORBIDDEN" } });
    }

    const { id } = await params;
    const run = await PayrollRunRepository.findById(id, user.organizationId);
    if (!run) {
      return NextResponse.json({ error: { code: "NOT_FOUND", message: "Run not found" } }, { status: 404 });
    }

    const items = await PayrollItemRepository.findByRunId(user.organizationId, id);

    return NextResponse.json({ data: { run, items } });
  } catch (error: unknown) {
    console.error("Get run error:", error);
    if (error instanceof AppError) {
      return NextResponse.json({ error: { code: (error as any).code, message: (error as any).message } }, { status: (error as any).statusCode });
    }
    return createApiResponse({ success: false, message: "Internal server error", status: 500, errors: { code: "INTERNAL_ERROR" } });
  }
}
