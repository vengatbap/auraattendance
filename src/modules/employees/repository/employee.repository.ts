import { db } from "@/db";
import { employees, faceProfiles } from "@/db/schema";
import { and, eq, isNull, or, sql } from "drizzle-orm";
import type { EmployeeEntity } from "../types";
import type { CreateEmployeeInput, UpdateEmployeeInput } from "../validator/employee.validator";
import { ConflictError, NotFoundError } from "@/lib/errors";

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
        isActive: input.isActive ?? true,
        enrollmentPhoto: input.enrollmentPhoto || null,
      })
      .returning();
    return inserted as unknown as EmployeeEntity;
  }

  async findById(id: string, organizationId: string): Promise<EmployeeEntity & { isFaceEnrolled?: boolean } | null> {
    const records = await db
      .select({
        employee: employees,
        hasFaceProfile: sql<boolean>`CASE WHEN ${faceProfiles.id} IS NOT NULL THEN true ELSE false END`,
      })
      .from(employees)
      .leftJoin(faceProfiles, eq(faceProfiles.employeeId, employees.id))
      .where(
        and(
          eq(employees.id, id),
          eq(employees.organizationId, organizationId),
          isNull(employees.deletedAt)
        )
      )
      .limit(1);
    
    if (!records.length) return null;
    
    return {
      ...(records[0].employee as unknown as EmployeeEntity),
      isFaceEnrolled: records[0].hasFaceProfile,
    };
  }

  async list(organizationId: string): Promise<(EmployeeEntity & { isFaceEnrolled?: boolean })[]> {
    const records = await db
      .select({
        employee: employees,
        hasFaceProfile: sql<boolean>`CASE WHEN ${faceProfiles.id} IS NOT NULL THEN true ELSE false END`,
      })
      .from(employees)
      .leftJoin(faceProfiles, eq(faceProfiles.employeeId, employees.id))
      .where(
        and(
          eq(employees.organizationId, organizationId),
          isNull(employees.deletedAt)
        )
      );
      
    return records.map(r => ({
      ...(r.employee as unknown as EmployeeEntity),
      isFaceEnrolled: r.hasFaceProfile,
    }));
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
    const current = await this.findById(id, organizationId);
    if (!current) throw new NotFoundError("Employee not found");
    const currentVersion = current.version ?? 1;

    const [updated] = await db
      .update(employees)
      .set({
        ...input,
        version: currentVersion + 1,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(employees.id, id),
          eq(employees.organizationId, organizationId),
          eq(employees.version, currentVersion),
          isNull(employees.deletedAt)
        )
      )
      .returning();

    if (!updated) {
      throw new ConflictError("Concurrent modification detected. Please reload and try again.");
    }
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
