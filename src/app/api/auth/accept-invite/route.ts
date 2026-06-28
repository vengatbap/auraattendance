import { NextResponse } from "next/server";
import { db } from "@/db";
import { userInvitations, users } from "@/db/schema";
import { acceptInviteSchema } from "@/modules/invitations/validator/invitation.validator";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { loginSession } from "@/lib/auth";
import { logger } from "@/lib/logger";
import { AuditService } from "@/modules/audit/service/audit.service";

export async function POST(req: Request) {
  return logger.track("Accept Invite API", async () => {
    try {
      const body = await req.json();
      const parsed = acceptInviteSchema.safeParse(body);
      if (!parsed.success) {
        return NextResponse.json(
          { success: false, message: "Validation failed", data: null, meta: null, errors: parsed.error.flatten().fieldErrors },
          { status: 400 }
        );
      }

      const { token, name, password } = parsed.data;

      // Find invitation
      const [inv] = await db
        .select()
        .from(userInvitations)
        .where(eq(userInvitations.token, token))
        .limit(1);

      if (!inv) {
        throw new Error("TOKEN_NOT_FOUND");
      }

      if (inv.status !== "pending") {
        throw new Error("TOKEN_ALREADY_USED");
      }

      if (inv.expiresAt < new Date()) {
        // Update status to expired
        await db
          .update(userInvitations)
          .set({ status: "expired" })
          .where(eq(userInvitations.id, inv.id));
        throw new Error("TOKEN_EXPIRED");
      }

      // Check if user already exists
      const [existingUser] = await db
        .select()
        .from(users)
        .where(eq(users.email, inv.email))
        .limit(1);

      if (existingUser) {
        throw new Error("USER_ALREADY_EXISTS");
      }

      // Hash password
      const passwordHash = await bcrypt.hash(password, 12);

      // Create the admin user
      const [newUser] = await db
        .insert(users)
        .values({
          organizationId: inv.organizationId,
          email: inv.email,
          passwordHash,
          role: "admin",
          name,
        })
        .returning();

      // Update invitation status to accepted
      await db
        .update(userInvitations)
        .set({ status: "accepted" })
        .where(eq(userInvitations.id, inv.id));

      const result = { newUser, inv };

      // Audit log acceptance
      void AuditService.log({
        organizationId: result.inv.organizationId,
        userId: result.newUser.id,
        action: "accept_invitation",
        entity: "user_invitation",
        entityId: result.inv.id,
        details: { email: result.inv.email },
      });

      // Login session automatically
      await loginSession(
        result.newUser.id,
        result.newUser.role as "super_admin" | "admin",
        result.newUser.organizationId
      );

      return NextResponse.json({
        success: true,
        message: "Invitation accepted and account created successfully.",
        data: {
          user: {
            id: result.newUser.id,
            name: result.newUser.name,
            email: result.newUser.email,
            role: result.newUser.role,
          },
        },
        meta: null,
        errors: null,
      });
    } catch (err: unknown) {
      const error = err as Error;
      if (error.message === "TOKEN_NOT_FOUND") {
        return NextResponse.json(
          { success: false, message: "Invalid token", data: null, meta: null, errors: { token: ["Invitation token is invalid"] } },
          { status: 404 }
        );
      }
      if (error.message === "TOKEN_ALREADY_USED") {
        return NextResponse.json(
          { success: false, message: "Token already accepted", data: null, meta: null, errors: { token: ["This invitation has already been accepted or cancelled"] } },
          { status: 400 }
        );
      }
      if (error.message === "TOKEN_EXPIRED") {
        return NextResponse.json(
          { success: false, message: "Token expired", data: null, meta: null, errors: { token: ["This invitation token has expired"] } },
          { status: 400 }
        );
      }
      if (error.message === "USER_ALREADY_EXISTS") {
        return NextResponse.json(
          { success: false, message: "Account already exists", data: null, meta: null, errors: { global: ["An account with this email address already exists"] } },
          { status: 409 }
        );
      }

      logger.error("Accept invite failed", error);
      return NextResponse.json(
        { success: false, message: "Internal server error", data: null, meta: null, errors: { global: ["Failed to process invitation"] } },
        { status: 500 }
      );
    }
  });
}
