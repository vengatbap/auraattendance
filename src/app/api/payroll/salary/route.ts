/* eslint-disable @typescript-eslint/no-explicit-any */
import { createApiResponse } from "@/lib/api-response";
import { NextRequest, NextResponse } from "next/server";
import { requireTenantContext } from "@/lib/auth";
import { PermissionService } from "@/modules/permissions/service/permission.service";
import { SalaryService } from "@/modules/payroll/services/salary.service";
import { salarySettingInsertSchema } from "@/modules/payroll/validators";
import { AppError } from "@/lib/errors";

export async function POST(req: NextRequest) {
  try {
    const user = await requireTenantContext();
    if (PermissionService.cannot(user, "payroll.settings")) {
      return createApiResponse({ success: false, message: "Forbidden", status: 403, errors: { code: "FORBIDDEN" } });
    }

    const body = await req.json();
    const result = salarySettingInsertSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json({
        error: { code: "VALIDATION_ERROR", message: "Invalid payload", details: result.error }
      }, { status: 400 });
    }

    const data = result.data;
    const salary = await SalaryService.configureSalary(
      user.organizationId,
      data.employeeId,
      user.userId,
      data
    );

    return createApiResponse({ success: true, message: "Success", data: salary });
  } catch (error: unknown) {
    console.error("Salary configure error:", error);
    if (error instanceof AppError) {
      return NextResponse.json({ error: { code: (error as any).code, message: (error as any).message } }, { status: (error as any).statusCode });
    }
    return createApiResponse({ success: false, message: "Internal server error", status: 500, errors: { code: "INTERNAL_ERROR" } });
  }
}

