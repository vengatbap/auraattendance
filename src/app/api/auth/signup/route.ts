import { NextResponse } from "next/server";
import { db } from "@/db";
import { organizations, users } from "@/db/schema";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { loginSession } from "@/lib/auth";
import { logger } from "@/lib/logger";
import { AuditService } from "@/modules/audit/service/audit.service";

const signupSchema = z.object({
  organizationName: z.string().min(2, "Organization name must be at least 2 characters").max(255),
  organizationSlug: z
    .string()
    .min(2, "Slug must be at least 2 characters")
    .max(120)
    .regex(/^[a-z0-9-]+$/, "Slug must contain only lowercase letters, numbers, and hyphens"),
  ownerName: z.string().min(2, "Owner name must be at least 2 characters").max(255),
  ownerEmail: z.string().email("Invalid email address"),
  ownerPassword: z.string().min(8, "Password must be at least 8 characters"),
});

export async function POST(req: Request) {
  return logger.track("Signup API", async () => {
    try {
      const data = await req.json();
      const parsed = signupSchema.safeParse(data);

      if (!parsed.success) {
        return NextResponse.json(
          {
            success: false,
            message: "Validation failed",
            data: null,
            meta: null,
            errors: parsed.error.flatten().fieldErrors,
          },
          { status: 400 }
        );
      }

      const { organizationName, organizationSlug, ownerName, ownerEmail, ownerPassword } = parsed.data;

      // Check organization slug uniqueness
      const existingOrg = await db
        .select()
        .from(organizations)
        .where(eq(organizations.slug, organizationSlug))
        .limit(1);

      if (existingOrg.length > 0) {
        throw new Error("SLUG_ALREADY_EXISTS");
      }

      // Check user email uniqueness
      const existingUser = await db
        .select()
        .from(users)
        .where(eq(users.email, ownerEmail))
        .limit(1);

      if (existingUser.length > 0) {
        throw new Error("EMAIL_ALREADY_EXISTS");
      }

      // Create organization
      const [org] = await db
        .insert(organizations)
        .values({
          name: organizationName,
          slug: organizationSlug,
          subscriptionPlan: "trial",
          trialEndsAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14-day trial
        })
        .returning();

      // Hash owner password
      const passwordHash = await bcrypt.hash(ownerPassword, 12);

      // Create owner admin
      const [owner] = await db
        .insert(users)
        .values({
          organizationId: org.id,
          email: ownerEmail,
          passwordHash,
          role: "admin",
          name: ownerName,
        })
        .returning();

      const signupResult = { org, owner };

      // Log audit events outside transaction to keep transaction block fast
      void AuditService.log({
        organizationId: signupResult.org.id,
        userId: signupResult.owner.id,
        action: "organization_signup",
        entity: "organization",
        entityId: signupResult.org.id,
        details: { orgName: organizationName, ownerEmail },
      });

      // Login session setting
      await loginSession(
        signupResult.owner.id,
        signupResult.owner.role as "super_admin" | "admin",
        signupResult.org.id
      );

      return NextResponse.json({
        success: true,
        message: "Organization signed up successfully.",
        data: {
          organization: {
            id: signupResult.org.id,
            name: signupResult.org.name,
            slug: signupResult.org.slug,
          },
          owner: {
            id: signupResult.owner.id,
            name: signupResult.owner.name,
            email: signupResult.owner.email,
            role: signupResult.owner.role,
          },
        },
        meta: null,
        errors: null,
      });
    } catch (err: unknown) {
      const error = err as Error;
      if (error.message === "SLUG_ALREADY_EXISTS") {
        return NextResponse.json(
          {
            success: false,
            message: "Company slug is already in use.",
            data: null,
            meta: null,
            errors: { organizationSlug: ["This link slug is already taken"] },
          },
          { status: 409 }
        );
      }

      if (error.message === "EMAIL_ALREADY_EXISTS") {
        return NextResponse.json(
          {
            success: false,
            message: "Email address is already in use.",
            data: null,
            meta: null,
            errors: { ownerEmail: ["An administrator with this email already exists"] },
          },
          { status: 409 }
        );
      }

      logger.error("Signup failed", error);
      return NextResponse.json(
        {
          success: false,
          message: "Internal server error.",
          data: null,
          meta: null,
          errors: { global: ["An unexpected error occurred during signup"] },
        },
        { status: 500 }
      );
    }
  });
}

// Helper eq import
import { eq } from "drizzle-orm";
