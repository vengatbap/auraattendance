import { NextRequest } from "next/server";
import { getSession } from "@/lib/auth";
import { OperationsService } from "@/modules/operations/service/operations.service";
import { PermissionService } from "@/lib/rbac";
import { createApiResponse } from "@/lib/api-response";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session || !session.organizationId || !session.userId) {
      return createApiResponse({ success: false, message: "Unauthorized", status: 401 });
    }
    if (PermissionService.cannot(session, "attendance.adjust")) {
      return createApiResponse({ success: false, message: "Forbidden", status: 403 });
    }
    
    const { id } = await params;
    const body = await req.json();
    const { resolutionType, reason, extraData } = body;

    if (!reason || !resolutionType) {
      return createApiResponse({ success: false, message: "Missing fields", status: 400 });
    }

    await OperationsService.resolve(
      session.organizationId,
      session.userId,
      id,
      resolutionType,
      reason,
      extraData
    );

    return createApiResponse({ success: true, message: "Resolved successfully" });
  } catch (error) {
    return createApiResponse({ success: false, message: "Internal Error", status: 500 });
  }
}
