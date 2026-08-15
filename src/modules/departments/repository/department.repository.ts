import { db } from "@/db";
import { departments } from "@/db/schema";
import { and, eq, isNull } from "drizzle-orm";
import { DepartmentEntity } from "../types";
import { ConflictError, NotFoundError } from "@/lib/errors";

export const departmentRepository = {
  async findAll(organizationId: string): Promise<DepartmentEntity[]> {
    return db
      .select()
      .from(departments)
      .where(and(eq(departments.organizationId, organizationId), isNull(departments.deletedAt))) as Promise<DepartmentEntity[]>;
  },

  async findActive(organizationId: string): Promise<DepartmentEntity[]> {
    return db
      .select()
      .from(departments)
      .where(
        and(
          eq(departments.organizationId, organizationId),
          eq(departments.status, "active"),
          isNull(departments.deletedAt)
        )
      ) as Promise<DepartmentEntity[]>;
  },

  async findById(id: string, organizationId: string): Promise<DepartmentEntity | null> {
    const [result] = await db
      .select()
      .from(departments)
      .where(
        and(
          eq(departments.id, id),
          eq(departments.organizationId, organizationId),
          isNull(departments.deletedAt)
        )
      )
      .limit(1);
    return (result as DepartmentEntity) ?? null;
  },

  async create(organizationId: string, data: {
    name: string;
    status: "active" | "inactive";
  }): Promise<DepartmentEntity> {
    const [result] = await db
      .insert(departments)
      .values({
        organizationId,
        name: data.name,
        status: data.status,
      })
      .returning();
    return result as DepartmentEntity;
  },

  async update(
    id: string,
    organizationId: string,
    data: Partial<{
      name: string;
      status: "active" | "inactive";
    }>
  ): Promise<DepartmentEntity> {
    const current = await this.findById(id, organizationId);
    if (!current) throw new NotFoundError("Department not found");
    const currentVersion = current.version ?? 1;

    const [result] = await db
      .update(departments)
      .set({
        ...data,
        version: currentVersion + 1,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(departments.id, id),
          eq(departments.organizationId, organizationId),
          eq(departments.version, currentVersion)
        )
      )
      .returning();

    if (!result) {
      throw new ConflictError("Concurrent modification detected. Please reload and try again.");
    }
    return result as DepartmentEntity;
  },

  async delete(id: string, organizationId: string): Promise<void> {
    // Soft delete
    await db
      .update(departments)
      .set({ deletedAt: new Date() })
      .where(and(eq(departments.id, id), eq(departments.organizationId, organizationId)));
  },
};
