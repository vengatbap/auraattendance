/* eslint-disable @typescript-eslint/no-explicit-any */
import { createApiResponse } from "@/lib/api-response";
import { NextRequest, NextResponse } from "next/server";
import { requireTenantContext } from "@/lib/auth";
import { PermissionService } from "@/modules/permissions/service/permission.service";
import { SalaryService } from "@/modules/payroll/services/salary.service";
import { AppError } from "@/lib/errors";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ employeeId: string }> }
) {
  try {
    const user = await requireTenantContext();
    if (PermissionService.cannot(user, "payroll.read")) {
      return createApiResponse({ success: false, message: "Forbidden", status: 403, errors: { code: "FORBIDDEN" } });
    }

    const { employeeId } = await params;
    const salary = await SalaryService.getSalary(user.organizationId, employeeId);
    
    return createApiResponse({ success: true, message: "Success", data: salary });
  } catch (error: unknown) {
    console.error("Get salary error:", error);
    if (error instanceof AppError) {
      return NextResponse.json({ error: { code: (error as any).code, message: (error as any).message } }, { status: (error as any).statusCode });
    }
    return createApiResponse({ success: false, message: "Internal server error", status: 500, errors: { code: "INTERNAL_ERROR" } });
  }
}
