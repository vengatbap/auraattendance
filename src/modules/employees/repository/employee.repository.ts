import { db } from "@/db";
import { employees } from "@/db/schema";
import { and, eq, isNull, or, sql } from "drizzle-orm";
import type { EmployeeEntity } from "../types";
import type { CreateEmployeeInput, UpdateEmployeeInput } from "../validator/employee.validator";

export class EmployeeRepository {
  async create(organizationId: string, input: CreateEmployeeInput): Promise<EmployeeEntity> {
    const [inserted] = await db
      .insert(employees)
      .values({
        organizationId,
        employeeCode: input.employeeCode,
        governmentId: input.governmentId,
        name: input.name,
        siteId: input.siteId || null,
        departmentId: input.departmentId || null,
        designation: input.designation || null,
        phone: input.phone || null,
        email: input.email || null,
        status: input.status,
        enrollmentPhoto: input.enrollmentPhoto || null,
      })
      .returning();
    return inserted as unknown as EmployeeEntity;
  }

  async findById(id: string, organizationId: string): Promise<EmployeeEntity | null> {
    const [record] = await db
      .select()
      .from(employees)
      .where(
        and(
          eq(employees.id, id),
          eq(employees.organizationId, organizationId),
          isNull(employees.deletedAt)
        )
      )
      .limit(1);
    return (record as unknown as EmployeeEntity) || null;
  }

  async list(organizationId: string): Promise<EmployeeEntity[]> {
    const records = await db
      .select()
      .from(employees)
      .where(
        and(
          eq(employees.organizationId, organizationId),
          isNull(employees.deletedAt)
        )
      );
    return records as unknown as EmployeeEntity[];
  }

  async findDuplicate(
    organizationId: string,
    employeeCode: string,
    governmentId: string,
    email?: string | null
  ): Promise<EmployeeEntity | null> {
    const conditions = [
      and(eq(employees.employeeCode, employeeCode), eq(employees.organizationId, organizationId)),
      and(eq(employees.governmentId, governmentId), eq(employees.organizationId, organizationId)),
    ];

    if (email) {
      conditions.push(and(eq(employees.email, email), eq(employees.organizationId, organizationId)));
    }

    const [existing] = await db
      .select()
      .from(employees)
      .where(and(or(...conditions), isNull(employees.deletedAt)))
      .limit(1);

    return (existing as unknown as EmployeeEntity) || null;
  }

  async update(
    id: string,
    organizationId: string,
    input: UpdateEmployeeInput
  ): Promise<EmployeeEntity> {
    const [updated] = await db
      .update(employees)
      .set({
        ...input,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(employees.id, id),
          eq(employees.organizationId, organizationId),
          isNull(employees.deletedAt)
        )
      )
      .returning();
    return updated as unknown as EmployeeEntity;
  }

  async delete(id: string, organizationId: string): Promise<void> {
    await db
      .update(employees)
      .set({
        deletedAt: new Date(),
      })
      .where(
        and(
          eq(employees.id, id),
          eq(employees.organizationId, organizationId)
        )
      );
  }

  async count(organizationId: string): Promise<number> {
    const [result] = await db
      .select({ count: sql<number>`count(*)` })
      .from(employees)
      .where(
        and(
          eq(employees.organizationId, organizationId),
          isNull(employees.deletedAt)
        )
      );
    return Number(result?.count || 0);
  }
}

export const employeeRepository = new EmployeeRepository();
