import { NextResponse } from "next/server";
import { enterSupportSession } from "@/lib/auth";
import { AuditService } from "@/modules/audit/service/audit.service";
import { getSession } from "@/lib/auth";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session || !session.isPlatformUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { id } = await params;

    await enterSupportSession(id);

    await AuditService.log({
      organizationId: id,
      userId: session.userId,
      action: "ENTER_SUPPORT_MODE",
      entity: "system",
      details: "Platform admin entered support mode",
    });

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    console.error("Enter support mode error:", error);
    return NextResponse.json({ error: "Failed to enter support mode" }, { status: 500 });
  }
}
