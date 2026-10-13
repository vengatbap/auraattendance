import { NextRequest } from "next/server";
import { getSession, decrypt } from "@/lib/auth";
import { logger } from "@/lib/logger";
import { isAllowed } from "@/lib/rate-limit";
import { createApiResponse } from "@/lib/api-response";
import { AttendanceEngine } from "@/modules/attendance-engine";

export async function POST(req: NextRequest) {
  const requestId = "req_" + Math.random().toString(16).slice(2, 10);

  return logger.track(`POST /api/attendance/punch [${requestId}]`, async () => {
    try {
      // 1. IP-based rate limiting (10 requests/minute/IP)
      const ipAddress =
        req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
        req.headers.get("x-real-ip") ??
        "127.0.0.1";

      if (!isAllowed(`punch:ip:${ipAddress}`, 10, 60 * 1000)) {
        return createApiResponse({
          success: false,
          requestId,
          message: "Too many punch requests from this IP. Please try again in a minute.",
          status: 429,
        });
      }

      // 2. Parse payload safely
      let body;
      try {
        body = await req.json();
      } catch {
        return createApiResponse({
          success: false,
          requestId,
          message: "Invalid JSON body",
          status: 400,
        });
      }

      // 3. Resolve Trusted Security Context
      let trustedOrgId: string | null = null;
      let allowedSiteId: string | undefined = undefined;
      let kioskId: string | undefined = undefined;

      const session = await getSession();
      if (session?.organizationId) {
        trustedOrgId = session.organizationId;
      } else if (body.kioskToken) {
        try {
          const kioskPayload = await decrypt(body.kioskToken);
          if (kioskPayload && kioskPayload.organizationId) {
            trustedOrgId = kioskPayload.organizationId;
            allowedSiteId = kioskPayload.allowedSiteId as string | undefined;
            kioskId = kioskPayload.kioskId as string | undefined;
          }
        } catch {
          return createApiResponse({
            success: false,
            requestId,
            message: "Invalid or expired kiosk token",
            status: 401,
          });
        }
      }

      if (!trustedOrgId) {
        return createApiResponse({
          success: false,
          requestId,
          message: "Unauthorized: missing trusted kiosk or session context",
          status: 401,
        });
      }

      // 4. Sanitize Input (Zero-Trust boundary: client cannot forge organizationId, punchType, etc.)
      const input = {
        clientEventId: body.clientEventId,
        kioskToken: body.kioskToken,
        employeeCode: body.employeeCode,
        descriptor: body.descriptor,
        photoUrl: body.photoUrl,
        latitude: body.latitude,
        longitude: body.longitude,
        deviceInfo: body.deviceInfo,
        browser: body.browser,
        capturedAt: body.capturedAt || new Date().toISOString(),
        isOffline: body.isOffline ?? false,
        authMethod: body.authMethod || "FACE",
        pin: body.pin,
        faceMatchPassed: body.faceMatchPassed,
      };

      if (!input.clientEventId) {
        return createApiResponse({
          success: false,
          requestId,
          message: "clientEventId is required for idempotency tracking",
          status: 400,
        });
      }

      // 5. Invoke the Attendance Engine pipeline
      const trustedContext = {
        organizationId: trustedOrgId,
        kioskId,
        allowedSiteId,
        requestId,
        ipAddress,
        receivedAt: new Date(),
      };

      const result = await AttendanceEngine.processPunch(input, trustedContext);

      if (!result.success) {
        return createApiResponse({
          success: false,
          requestId,
          message: result.errorMessage || "Punch rejected by policy engine",
          data: result,
          status: 400, // Policy rejection returns success: false with 400 payload
        });
      }

      return createApiResponse({
        success: true,
        requestId,
        message: "Attendance punch recorded successfully",
        data: result,
      });
    } catch (err: unknown) {
      const error = err as Error;
      logger.error("Punch request processing error", error);
      return createApiResponse({
        success: false,
        requestId,
        message: error.message || "Failed to process punch request",
        status: 500,
      });
    }
  });
}
