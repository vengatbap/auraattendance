import { db } from "@/db";
import { auditLogs } from "@/db/schema";
import { desc } from "drizzle-orm";

export const auditRepository = {
  async log(data: { userId?: string; action: string; entity: string; entityId?: string; details?: unknown }) {
    await db.insert(auditLogs).values({
      userId: data.userId as any ?? null,
      action: data.action,
      entity: data.entity,
      entityId: data.entityId as any ?? null,
      details: data.details ?? null,
    });
  },

  async findAll(limit = 50) {
    return db.select().from(auditLogs).orderBy(desc(auditLogs.createdAt)).limit(limit);
  },
};
