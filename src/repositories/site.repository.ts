import { db } from "@/db";
import { sites } from "@/db/schema";
import { eq } from "drizzle-orm";

export const siteRepository = {
  async findAll() {
    return db.select().from(sites);
  },

  async findActive() {
    return db.select().from(sites).where(eq(sites.status, "active"));
  },

  async findById(id: string) {
    const result = await db.select().from(sites).where(eq(sites.id, id)).limit(1);
    return result[0] ?? null;
  },

  async create(data: typeof sites.$inferInsert) {
    const [result] = await db.insert(sites).values(data).returning();
    return result;
  },

  async update(id: string, data: Partial<typeof sites.$inferInsert>) {
    const [result] = await db.update(sites).set({ ...data, updatedAt: new Date() }).where(eq(sites.id, id)).returning();
    return result;
  },

  async delete(id: string) {
    await db.delete(sites).where(eq(sites.id, id));
  },
};
