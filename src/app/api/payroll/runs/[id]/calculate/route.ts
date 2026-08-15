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
    if (PermissionService.cannot(user, "payroll.calculate")) {
      return createApiResponse({ success: false, message: "Forbidden", status: 403, errors: { code: "FORBIDDEN" } });
    }

    const { id } = await params;
    
    // In a real system, we'd trigger a background job here and return 202 Accepted.
    // For Aura V1, we'll await it if it's fast enough, or we can just run it inline.
    await PayrollService.calculateRun(user.organizationId, id, user.userId);

    return NextResponse.json({ data: { success: true } });
  } catch (error: unknown) {
    console.error("Calculate run error:", error);
    if (error instanceof AppError) {
      return NextResponse.json({ error: { code: (error as any).code, message: (error as any).message } }, { status: (error as any).statusCode });
    }
    return createApiResponse({ success: false, message: "Internal server error", status: 500, errors: { code: "INTERNAL_ERROR" } });
  }
}
