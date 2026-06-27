import { NextResponse } from "next/server";
import { authService } from "@/modules/auth/service/auth.service";
import { resetPasswordSchema } from "@/modules/auth/validator/auth.validator";
import { logger } from "@/lib/logger";

export async function POST(req: Request) {
  return logger.track("Reset Password API", async () => {
    try {
      const body = await req.json();
      const parsed = resetPasswordSchema.safeParse(body);
      if (!parsed.success) {
        return NextResponse.json(
          { success: false, message: "Validation failed", data: null, meta: null, errors: parsed.error.flatten().fieldErrors },
          { status: 400 }
        );
      }

      await authService.resetPassword(parsed.data.token, parsed.data.password);

      return NextResponse.json({
        success: true,
        message: "Password has been reset successfully. You can now login.",
        data: null,
        meta: null,
        errors: null,
      });
    } catch (err: unknown) {
      const error = err as Error;
      logger.error("Reset password failed", error);
      return NextResponse.json(
        {
          success: false,
          message: error.message || "Failed to reset password",
          data: null,
          meta: null,
          errors: { global: [error.message || "Invalid or expired token"] },
        },
        { status: 400 }
      );
    }
  });
}
