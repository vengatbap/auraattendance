import { db } from "@/db";
import { salarySettings, employees } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { Allowance, Deduction } from "../types";

export class SalaryRepository {
  /**
   * Fetch an employee's salary settings
   */
  static async getByEmployeeId(organizationId: string, employeeId: string) {
    return await db.query.salarySettings.findFirst({
      where: and(
        eq(salarySettings.organizationId, organizationId),
        eq(salarySettings.employeeId, employeeId),
        eq(salarySettings.status, "ACTIVE")
      ),
    });
  }

  /**
   * Fetch salary settings for multiple employees efficiently
   */
  static async getBatchByEmployeeIds(organizationId: string, employeeIds: string[]) {
    if (employeeIds.length === 0) return [];
    
    const settings = await db.query.salarySettings.findMany({
      where: and(
        eq(salarySettings.organizationId, organizationId),
        eq(salarySettings.status, "ACTIVE")
      ),
    });

    // We filter in memory for large lists if "inArray" hits postgres limits,
    // but typically we can just return the filtered list.
    return settings.filter(s => employeeIds.includes(s.employeeId));
  }

  static async upsertSalary(
    organizationId: string,
    employeeId: string,
    data: {
      currency: string;
      payFrequency: string;
      basicSalary: string;
      overtimeRate: string;
      workingDaysPerPeriod: string;
      workingHoursPerDay: string;
      fixedAllowances: Allowance[];
      fixedDeductions: Deduction[];
      effectiveFrom: string;
      effectiveTo?: string | null;
      updatedBy: string;
    }
  ) {
    const existing = await this.getByEmployeeId(organizationId, employeeId);

    if (existing) {
      return await db.update(salarySettings)
        .set({
          ...data,
          effectiveTo: data.effectiveTo || null, // Convert undefined to null
          version: existing.version + 1,
        })
        .where(
          and(
            eq(salarySettings.id, existing.id),
            eq(salarySettings.organizationId, organizationId)
          )
        )
        .returning();
    } else {
      return await db.insert(salarySettings)
        .values({
          organizationId,
          employeeId,
          ...data,
          effectiveTo: data.effectiveTo || null,
          createdBy: data.updatedBy,
        })
        .returning();
    }
  }
}
