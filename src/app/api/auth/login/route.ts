import { db } from "@/db";
import { users, organizations } from "@/db/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { loginSession } from "@/lib/auth";
import { loginSchema } from "@/modules/auth/validator/auth.validator";
import { isAllowed } from "@/lib/rate-limit";
import { createApiResponse } from "@/lib/api-response";
import { UserRole } from "@/modules/permissions/types";

export async function POST(req: Request) {
  try {
    // 1. Rate Limiting by IP (5 attempts per minute)
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0].trim() || req.headers.get("x-real-ip") || "127.0.0.1";
    if (!isAllowed(`login:${ip}`, 5, 60 * 1000)) {
      return createApiResponse({
        success: false,
        message: "Too many login attempts. Please try again in a minute.",
        status: 429,
      });
    }

    // 2. Parse payload
    const parsed = loginSchema.safeParse(await req.json());
    if (!parsed.success) {
      return createApiResponse({
        success: false,
        message: "Invalid input payload",
        errors: parsed.error.issues,
        status: 400,
      });
    }

    const { email, password } = parsed.data;
    const userArray = await db.select().from(users).where(eq(users.email, email)).limit(1);
    const user = userArray[0];

    if (!user) {
      return createApiResponse({
        success: false,
        message: "Invalid credentials",
        status: 401,
      });
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return createApiResponse({
        success: false,
        message: "Invalid credentials",
        status: 401,
      });
    }

    // Tenant Suspension and Trial Checks
    if (!user.isPlatformUser && user.organizationId) {
      const [org] = await db
        .select()
        .from(organizations)
        .where(eq(organizations.id, user.organizationId))
        .limit(1);

      if (!org) {
        return createApiResponse({
          success: false,
          message: "Organization not found",
          status: 403,
        });
      }

      if (org.status === "suspended") {
        return createApiResponse({
          success: false,
          message: "Your organization has been suspended. Please contact support.",
          status: 403,
        });
      }

      if (org.subscriptionPlan === "trial" && org.trialEndsAt && new Date() > new Date(org.trialEndsAt)) {
        return createApiResponse({
          success: false,
          message: "Your organization's trial period has expired. Please upgrade.",
          status: 403,
        });
      }
    }

    await loginSession(
      user.id,
      user.role as UserRole,
      user.organizationId,
      user.isPlatformUser
    );

    return createApiResponse({
      success: true,
      message: "Logged in successfully",
      data: {
        user: {
          id: user.id,
          organizationId: user.organizationId,
          email: user.email,
          name: user.name,
          role: user.role,
          isPlatformUser: user.isPlatformUser,
        },
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    return createApiResponse({
      success: false,
      message: "Internal server error",
      status: 500,
    });
  }
}
