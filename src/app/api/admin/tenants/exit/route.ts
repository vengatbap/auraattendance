import { NextResponse } from "next/server";
import { exitSupportSession } from "@/lib/auth";
import { AuditService } from "@/modules/audit/service/audit.service";
import { getSession } from "@/lib/auth";

export async function POST() {
  try {
    const session = await getSession();
    if (!session || !session.isPlatformUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    if (session.supportTenantId) {
      await AuditService.log({
        organizationId: session.supportTenantId,
        userId: session.userId,
        action: "EXIT_SUPPORT_MODE",
        entity: "system",
        details: "Platform admin exited support mode",
      });
    }

    await exitSupportSession();

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    console.error("Exit support mode error:", error);
    return NextResponse.json({ error: "Failed to exit support mode" }, { status: 500 });
  }
}
