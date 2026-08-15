/* eslint-disable @typescript-eslint/no-explicit-any */
import { PunchInput, TrustedAttendanceContext, PunchResult } from "../types";
import { AttendanceEngine } from "../engine/attendance-engine";
import { ValidationError } from "@/lib/errors";

export interface SyncItemResult {
  clientEventId: string;
  success: boolean;
  action?: string;
  outcome?: string;
  flags?: string[];
  warnings?: string[];
  errorCode?: string;
}

export class OfflineSyncService {
  static async syncBatch(
    punches: PunchInput[],
    trustedBase: Omit<TrustedAttendanceContext, "requestId">
  ): Promise<SyncItemResult[]> {
    if (punches.length > 50) {
      throw new ValidationError("Batch size exceeds the maximum limit of 50 offline punch items");
    }

    // 1. Sort ascending by capturedAt to preserve sequential timeline ordering
    const sorted = [...punches].sort((a, b) => {
      const timeA = new Date(a.capturedAt).getTime();
      const timeB = new Date(b.capturedAt).getTime();
      return timeA - timeB;
    });

    const results: SyncItemResult[] = [];

    // 2. Process sequentially to prevent concurrent execution conflicts per employee
    for (let i = 0; i < sorted.length; i++) {
      const punch = sorted[i];
      const itemRequestId = `${trustedBase.organizationId}-sync-${punch.clientEventId.slice(0, 8)}-${Date.now()}-${i}`;

      const trustedContext: TrustedAttendanceContext = {
        ...trustedBase,
        requestId: itemRequestId,
      };

      try {
        const punchResult: PunchResult = await AttendanceEngine.processPunch(punch, trustedContext);
        results.push({
          clientEventId: punch.clientEventId,
          success: punchResult.success,
          action: punchResult.action,
          outcome: punchResult.success ? "ACCEPTED" : "REJECTED",
          flags: punchResult.flags,
          warnings: punchResult.warnings,
        });
      } catch (err: unknown) {
        const errAny = err as unknown as any;
        results.push({
          clientEventId: punch.clientEventId,
          success: false,
          errorCode: errAny.code || "SYNC_ITEM_FAILED",
          warnings: [(err as Error).message || "Failed to sync offline item"],
        });
      }
    }

    return results;
  }
}

