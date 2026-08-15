/* eslint-disable @typescript-eslint/no-explicit-any */
import { createApiResponse } from "@/lib/api-response";
import { NextRequest, NextResponse } from "next/server";
import { requireTenantContext } from "@/lib/auth";
import { PermissionService } from "@/modules/permissions/service/permission.service";
import { PayrollService } from "@/modules/payroll/services/payroll.service";
import { payrollPeriodInsertSchema } from "@/modules/payroll/validators";
import { AppError } from "@/lib/errors";
import { db } from "@/db";
import { payrollPeriods } from "@/db/schema";
import { eq, desc } from "drizzle-orm";

export async function POST(req: NextRequest) {
  try {
    const user = await requireTenantContext();
    if (PermissionService.cannot(user, "payroll.create")) {
      return createApiResponse({ success: false, message: "Forbidden", status: 403, errors: { code: "FORBIDDEN" } });
    }

    const body = await req.json();
    const result = payrollPeriodInsertSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json({
        error: { code: "VALIDATION_ERROR", message: "Invalid payload", details: result.error }
      }, { status: 400 });
    }

    const period = await PayrollService.createPeriod(
      user.organizationId,
      user.userId,
      result.data
    );

    return createApiResponse({ success: true, message: "Success", data: period });
  } catch (error: unknown) {
    console.error("Create period error:", error);
    if (error instanceof AppError) {
      return NextResponse.json({ error: { code: error.code, message: error.message } }, { status: error.statusCode });
    }
    const errAny = error as any;
    // Handle unique constraint violation
    if (errAny?.code === '23505') {
      return NextResponse.json({ error: { code: "PERIOD_EXISTS", message: "A period with these dates already exists" } }, { status: 409 });
    }
    return createApiResponse({ success: false, message: "Internal server error", status: 500, errors: { code: "INTERNAL_ERROR" } });
  }
}

export async function GET(req: NextRequest) {
  try {
    const user = await requireTenantContext();
    if (PermissionService.cannot(user, "payroll.read")) {
      return createApiResponse({ success: false, message: "Forbidden", status: 403, errors: { code: "FORBIDDEN" } });
    }

    const periods = await db.query.payrollPeriods.findMany({
      where: eq(payrollPeriods.organizationId, user.organizationId),
      orderBy: [desc(payrollPeriods.periodStart)],
      limit: 50,
    });

    return createApiResponse({ success: true, message: "Success", data: periods });
  } catch (error: unknown) {
    console.error("Get periods error:", error);
    return createApiResponse({ success: false, message: "Internal server error", status: 500, errors: { code: "INTERNAL_ERROR" } });
  }
}

