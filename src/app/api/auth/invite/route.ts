import { NextRequest } from "next/server";
import { getSession } from "@/lib/auth";
import { inviteAdminSchema } from "@/modules/invitations/validator/invitation.validator";
import { invitationService } from "@/modules/invitations/service/invitation.service";
import { PermissionService } from "@/lib/rbac";
import { logger } from "@/lib/logger";
import { createApiResponse } from "@/lib/api-response";

export async function POST(req: Request) {
  return logger.track("Invite Admin API", async () => {
    try {
      const session = await getSession();
      if (!session || !session.organizationId) {
        return createApiResponse({
          success: false,
          message: "Unauthorized",
          status: 401,
        });
      }

      // Enforce RBAC using PermissionService
      if (PermissionService.cannot(session, "user.invite")) {
        return createApiResponse({
          success: false,
          message: "Forbidden: insufficient permissions",
          status: 403,
        });
      }

      const body = await req.json();
      const parsed = inviteAdminSchema.safeParse(body);
      if (!parsed.success) {
        return createApiResponse({
          success: false,
          message: "Validation failed",
          errors: parsed.error.flatten().fieldErrors,
          status: 400,
        });
      }

      const invitation = await invitationService.inviteAdmin(
        session.organizationId,
        parsed.data.email,
        session.userId
      );

      // In production, send email. Here we return the token/link directly in DTO for admin setup visibility.
      const invitationLink = `${new URL(req.url).origin}/accept-invitation?token=${invitation.token}`;

      return createApiResponse({
        success: true,
        message: "Administrator invited successfully.",
        data: {
          invitation,
          invitationLink,
        },
      });
    } catch (err: unknown) {
      const error = err as Error & { code?: string };
      logger.error("Invite Admin failed", error);
      const isConflict = error.code === "CONFLICT" || error.message?.includes("already invited") || error.message?.includes("already exists");
      return createApiResponse({
        success: false,
        message: error.message || "Failed to invite administrator",
        status: isConflict ? 409 : 500,
      });
    }
  });
}
