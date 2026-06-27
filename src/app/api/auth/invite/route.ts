import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { inviteAdminSchema } from "@/modules/invitations/validator/invitation.validator";
import { invitationService } from "@/modules/invitations/service/invitation.service";
import { PermissionService } from "@/modules/permissions/service/permission.service";
import { logger } from "@/lib/logger";

export async function POST(req: Request) {
  return logger.track("Invite Admin API", async () => {
    try {
      const session = await getSession();
      if (!session) {
        return NextResponse.json(
          { success: false, message: "Unauthorized", data: null, meta: null, errors: { global: ["Authentication required"] } },
          { status: 401 }
        );
      }

      // Enforce RBAC using PermissionService
      const hasAccess = PermissionService.hasPermission(session, "manage_admins");
      if (!hasAccess) {
        return NextResponse.json(
          { success: false, message: "Forbidden", data: null, meta: null, errors: { global: ["Only super administrators can invite other admins"] } },
          { status: 403 }
        );
      }

      const body = await req.json();
      const parsed = inviteAdminSchema.safeParse(body);
      if (!parsed.success) {
        return NextResponse.json(
          { success: false, message: "Validation failed", data: null, meta: null, errors: parsed.error.flatten().fieldErrors },
          { status: 400 }
        );
      }

      if (!session.organizationId) {
        return NextResponse.json(
          { success: false, message: "User is not associated with an organization", data: null, meta: null, errors: { global: ["Invalid user session"] } },
          { status: 400 }
        );
      }

      const invitation = await invitationService.inviteAdmin(
        session.organizationId,
        parsed.data.email,
        session.userId
      );

      // In production, send email. Here we return the token/link directly in DTO for admin setup visibility.
      const invitationLink = `${new URL(req.url).origin}/accept-invitation?token=${invitation.token}`;

      return NextResponse.json({
        success: true,
        message: "Administrator invited successfully.",
        data: {
          invitation,
          invitationLink,
        },
        meta: null,
        errors: null,
      });
    } catch (err: any) {
      logger.error("Invite Admin failed", err);
      const isConflict = err.code === "CONFLICT";
      return NextResponse.json(
        {
          success: false,
          message: err.message || "Failed to invite administrator",
          data: null,
          meta: null,
          errors: { email: [err.message] },
        },
        { status: isConflict ? 409 : 500 }
      );
    }
  });
}
