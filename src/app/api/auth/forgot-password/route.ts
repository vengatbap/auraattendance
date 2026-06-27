import { NextResponse } from "next/server";
import { authService } from "@/modules/auth/service/auth.service";
import { forgotPasswordSchema } from "@/modules/auth/validator/auth.validator";
import { logger } from "@/lib/logger";

export async function POST(req: Request) {
  return logger.track("Forgot Password API", async () => {
    try {
      const body = await req.json();
      const parsed = forgotPasswordSchema.safeParse(body);
      if (!parsed.success) {
        return NextResponse.json(
          { success: false, message: "Validation failed", data: null, meta: null, errors: parsed.error.flatten().fieldErrors },
          { status: 400 }
        );
      }

      const token = await authService.forgotPassword(parsed.data.email);
      // Simulate email dispatch
      const resetLink = token ? `${new URL(req.url).origin}/reset-password?token=${token}` : null;

      return NextResponse.json({
        success: true,
        message: "If the email exists, a password reset link has been dispatched.",
        data: resetLink ? { resetLink } : null,
        meta: null,
        errors: null,
      });
    } catch (err: unknown) {
      const error = err as Error;
      logger.error("Forgot password failed", error);
      return NextResponse.json(
        { success: false, message: "Internal server error", data: null, meta: null, errors: { global: ["Something went wrong"] } },
        { status: 500 }
      );
    }
  });
}
