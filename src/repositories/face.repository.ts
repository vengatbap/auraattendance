import { db } from "@/db";
import { faceProfiles, employees } from "@/db/schema";
import { and, eq } from "drizzle-orm";

export const faceRepository = {
  async findByEmployee(employeeId: string) {
    const result = await db.select().from(faceProfiles).where(eq(faceProfiles.employeeId, employeeId)).limit(1);
    return result[0] ?? null;
  },

  async getAllEmbeddings() {
    return db
      .select({ employeeId: faceProfiles.employeeId, embedding: faceProfiles.embedding })
      .from(faceProfiles)
      .innerJoin(employees, eq(faceProfiles.employeeId, employees.id))
      .where(and(eq(employees.status, "active"), eq(faceProfiles.isActive, true)));
  },

  async upsert(employeeId: string, embedding: number[]) {
    const existing = await this.findByEmployee(employeeId);
    if (existing) {
      await db
        .update(faceProfiles)
        .set({ isActive: false })
        .where(eq(faceProfiles.employeeId, employeeId));

      const [result] = await db
        .insert(faceProfiles)
        .values({
          employeeId,
          organizationId: existing.organizationId,
          embedding,
          version: existing.version + 1,
          isActive: true,
        })
        .returning();
      return result;
    }
    const [result] = await db.insert(faceProfiles).values({ employeeId, embedding }).returning();
    return result;
  },

  async delete(employeeId: string) {
    await db.delete(faceProfiles).where(eq(faceProfiles.employeeId, employeeId));
  },
};
