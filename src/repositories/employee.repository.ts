import { db } from "@/db";
import { employees, faceProfiles } from "@/db/schema";
import { eq, like, or, and, sql } from "drizzle-orm";
import type { EmployeeStatus } from "@/types";

export const employeeRepository = {
  async findAll(params?: { search?: string; status?: EmployeeStatus; page?: number; pageSize?: number }) {
    const page = params?.page ?? 1;
    const pageSize = params?.pageSize ?? 20;
    const offset = (page - 1) * pageSize;

    const conditions = [];
    if (params?.status) conditions.push(eq(employees.status, params.status));
    if (params?.search) {
      conditions.push(
        or(
          like(employees.name, `%${params.search}%`),
          like(employees.employeeNumber, `%${params.search}%`),
          like(employees.cpr, `%${params.search}%`),
          like(employees.email, `%${params.search}%`)
        )
      );
    }

    const where = conditions.length > 0 ? and(...conditions) : undefined;

    const [data, countResult] = await Promise.all([
      db.select().from(employees).where(where).limit(pageSize).offset(offset),
      db.select({ count: sql<number>`count(*)` }).from(employees).where(where),
    ]);

    return {
      data,
      total: Number(countResult[0].count),
      page,
      pageSize,
      totalPages: Math.ceil(Number(countResult[0].count) / pageSize),
    };
  },

  async findById(id: string) {
    const result = await db.select().from(employees).where(eq(employees.id, id)).limit(1);
    return result[0] ?? null;
  },

  async findByEmployeeNumber(employeeNumber: string) {
    const result = await db.select().from(employees).where(eq(employees.employeeNumber, employeeNumber)).limit(1);
    return result[0] ?? null;
  },

  async create(data: typeof employees.$inferInsert) {
    const [result] = await db.insert(employees).values(data).returning();
    return result;
  },

  async update(id: string, data: Partial<typeof employees.$inferInsert>) {
    const [result] = await db.update(employees).set({ ...data, updatedAt: new Date() }).where(eq(employees.id, id)).returning();
    return result;
  },

  async delete(id: string) {
    await db.delete(employees).where(eq(employees.id, id));
  },

  async getFaceProfile(employeeId: string) {
    const result = await db.select().from(faceProfiles).where(eq(faceProfiles.employeeId, employeeId)).limit(1);
    return result[0] ?? null;
  },

  async getAllWithEmbeddings() {
    return db
      .select({ id: employees.id, name: employees.name, embedding: faceProfiles.embedding })
      .from(employees)
      .innerJoin(faceProfiles, eq(employees.id, faceProfiles.employeeId))
      .where(eq(employees.status, "active"));
  },
};
