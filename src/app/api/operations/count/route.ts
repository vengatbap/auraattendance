import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { OperationsService } from "@/modules/operations/service/operations.service";
import { PermissionService } from "@/lib/rbac";
import { createApiResponse } from "@/lib/api-response";

export async function GET(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session || !session.organizationId) {
      return createApiResponse({ success: false, message: "Unauthorized", status: 401 });
    }
    if (PermissionService.cannot(session, "attendance.adjust")) {
      return createApiResponse({ success: false, message: "Forbidden", status: 403 });
    }

    const anomalies = await OperationsService.getAnomalies(session.organizationId);
    return NextResponse.json({ count: anomalies.length });
  } catch (error) {
    return NextResponse.json({ count: 0 }, { status: 500 });
  }
}
