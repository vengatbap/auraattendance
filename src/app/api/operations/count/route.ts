import { NextRequest, NextResponse } from "next/server";
import { getSession, getTenantId } from "@/lib/auth";
import { OperationsService } from "@/modules/operations/service/operations.service";
import { PermissionService } from "@/lib/rbac";
import { createApiResponse } from "@/lib/api-response";

export async function GET(req: NextRequest) {
  try {
    const session = await getSession();
    const orgId = getTenantId(session);
    if (!session || !orgId) {
      return createApiResponse({ success: false, message: "Unauthorized", status: 401 });
    }
    if (PermissionService.cannot(session, "attendance.adjust")) {
      return createApiResponse({ success: false, message: "Forbidden", status: 403 });
    }

    const anomalies = await OperationsService.getAnomalies(orgId);
    return NextResponse.json({ count: anomalies.length });
  } catch (error) {
    console.error("GET /api/operations/count error:", error);
    return NextResponse.json({ count: 0 }, { status: 500 });
  }
}
