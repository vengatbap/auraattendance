/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest } from "next/server";
import { getSession, decrypt } from "@/lib/auth";
import { logger } from "@/lib/logger";
import { createApiResponse } from "@/lib/api-response";
import { OfflineSyncService } from "@/modules/attendance-engine";

export async function POST(req: NextRequest) {
  const batchRequestId = "req_sync_" + Math.random().toString(16).slice(2, 10);

  return logger.track(`POST /api/attendance/sync [${batchRequestId}]`, async () => {
    try {
      let body;
      try {
        body = await req.json();
      } catch {
        return createApiResponse({
          success: false,
          requestId: batchRequestId,
          message: "Invalid JSON body",
          status: 400,
        });
      }

      const { punches, kioskToken } = body;

      if (!punches || !Array.isArray(punches)) {
        return createApiResponse({
          success: false,
          requestId: batchRequestId,
          message: "punches parameter must be a valid array",
          status: 400,
        });
      }

      // Resolve Trusted Security Context (identical to kiosk / session lookup)
      let trustedOrgId: string | null = null;
      let allowedSiteId: string | undefined = undefined;
      let kioskId: string | undefined = undefined;

      const session = await getSession();
      if (session?.organizationId) {
        trustedOrgId = session.organizationId;
      } else if (kioskToken) {
        try {
          const kioskPayload = await decrypt(kioskToken);
          if (kioskPayload && kioskPayload.organizationId) {
            trustedOrgId = kioskPayload.organizationId;
            allowedSiteId = kioskPayload.allowedSiteId as string | undefined;
            kioskId = kioskPayload.kioskId as string | undefined;
          }
        } catch {
          return createApiResponse({
            success: false,
            requestId: batchRequestId,
            message: "Invalid or expired kiosk token",
            status: 401,
          });
        }
      }

      if (!trustedOrgId) {
        return createApiResponse({
          success: false,
          requestId: batchRequestId,
          message: "Unauthorized: missing trusted kiosk or session context",
          status: 401,
        });
      }

      // Sanitize input array
      const sanitizedPunches = punches.map((p: any) => ({
        clientEventId: p.clientEventId,
        kioskToken: kioskToken || p.kioskToken,
        employeeCode: p.employeeCode,
        descriptor: p.descriptor,
        photoUrl: p.photoUrl,
        latitude: p.latitude,
        longitude: p.longitude,
        deviceInfo: p.deviceInfo,
        browser: p.browser,
        capturedAt: p.capturedAt || new Date().toISOString(),
        isOffline: true, // Enforce isOffline parameter
      }));

      // Validate each item has clientEventId
      if (sanitizedPunches.some((p) => !p.clientEventId)) {
        return createApiResponse({
          success: false,
          requestId: batchRequestId,
          message: "Each punch item in the batch must have a valid clientEventId",
          status: 400,
        });
      }

      const ipAddress =
        req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
        req.headers.get("x-real-ip") ??
        "127.0.0.1";

      const trustedBase = {
        organizationId: trustedOrgId,
        kioskId,
        allowedSiteId,
        ipAddress,
        receivedAt: new Date(),
      };

      const results = await OfflineSyncService.syncBatch(sanitizedPunches, trustedBase);

      return createApiResponse({
        success: true,
        requestId: batchRequestId,
        message: "Offline sync batch processed",
        data: results,
      });
    } catch (err: unknown) {
      const error = err as Error;
      logger.error("Offline sync batch failed", error);
      return createApiResponse({
        success: false,
        requestId: batchRequestId,
        message: error.message || "Failed to process offline sync batch",
        status: 500,
      });
    }
  });
}
