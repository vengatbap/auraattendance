import { authService } from "@/modules/auth/service/auth.service";
import { forgotPasswordSchema } from "@/modules/auth/validator/auth.validator";
import { logger } from "@/lib/logger";
import { isAllowed } from "@/lib/rate-limit";
import { createApiResponse } from "@/lib/api-response";

export async function POST(req: Request) {
  return logger.track("Forgot Password API", async () => {
    try {
      const body = await req.json();
      const parsed = forgotPasswordSchema.safeParse(body);
      if (!parsed.success) {
        return createApiResponse({
          success: false,
          message: "Validation failed",
          errors: parsed.error.flatten().fieldErrors,
          status: 400,
        });
      }

      const email = parsed.data.email;

      // Rate limit: 3 requests/hour/email
      if (!isAllowed(`forgot_password:${email}`, 3, 60 * 60 * 1000)) {
        return createApiResponse({
          success: false,
          message: "Too many password reset requests. Please try again in an hour.",
          status: 429,
        });
      }

      const token = await authService.forgotPassword(email);
      // Simulate email dispatch
      const resetLink = token ? `${new URL(req.url).origin}/reset-password?token=${token}` : null;

      return createApiResponse({
        success: true,
        message: "If the email exists, a password reset link has been dispatched.",
        data: resetLink ? { resetLink } : null,
      });
    } catch (err: unknown) {
      const error = err as Error;
      logger.error("Forgot password failed", error);
      return createApiResponse({
        success: false,
        message: "Internal server error",
        status: 500,
      });
    }
  });
}
