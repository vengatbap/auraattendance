import { db } from "@/db";
import { auditLogs } from "@/db/schema";

export const AuditService = {
  async log(data: {
    organizationId?: string | null;
    userId?: string | null;
    action: string;
    entity: string;
    entityId?: string | null;
    details?: unknown;
  }) {
    try {
      await db.insert(auditLogs).values({
        organizationId: data.organizationId ?? null,
        userId: data.userId ?? null,
        action: data.action,
        entity: data.entity,
        entityId: data.entityId ?? null,
        details: data.details ?? null,
      });
    } catch (err) {
      // Fail-silent for audit logging to not block critical business transactions, but log to stderr
      console.error("Audit log failed to write:", err);
    }
  },
};
