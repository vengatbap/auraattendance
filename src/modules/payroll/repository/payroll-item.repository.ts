import { db } from "@/db";
import { payrollItems } from "@/db/schema";
import { eq, and } from "drizzle-orm";

export class PayrollItemRepository {
  static async insertBatch(
    organizationId: string,
    runId: string,
    items: (typeof payrollItems.$inferInsert)[] // Using any here to bypass complex mapping, but typically use specific type
  ) {
    if (items.length === 0) return [];
    
    // Convert to drizzle insert payloads
    const values = items.map((i) => ({
      organizationId,
      payrollRunId: runId,
      employeeId: i.employeeId,
      salarySettingId: i.salarySettingId,
      basicSalary: i.basicSalary,
      presentDays: String(i.presentDays ?? 0),
      paidLeaveDays: String(i.paidLeaveDays ?? 0),
      unpaidLeaveDays: String(i.unpaidLeaveDays ?? 0),
      absentDays: String(i.absentDays ?? 0),
      overtimeHours: String(i.overtimeHours ?? "0"),
      overtimeAmount: i.overtimeAmount,
      allowanceAmount: i.allowanceAmount,
      deductionAmount: i.deductionAmount,
      unpaidAbsenceAmount: i.unpaidAbsenceAmount,
      grossPay: i.grossPay,
      netPay: i.netPay,
      calculationSnapshot: i.calculationSnapshot,
      createdBy: i.createdBy,
    }));

    // Drizzle bulk insert
    return await db.insert(payrollItems).values(values).returning();
  }

  static async deleteByRunId(organizationId: string, runId: string) {
    return await db.delete(payrollItems)
      .where(
        and(
          eq(payrollItems.payrollRunId, runId),
          eq(payrollItems.organizationId, organizationId)
        )
      );
  }

  static async findByRunId(organizationId: string, runId: string) {
    return await db.query.payrollItems.findMany({
      where: and(
        eq(payrollItems.payrollRunId, runId),
        eq(payrollItems.organizationId, organizationId)
      ),
      with: {
        employee: true,
      }
    });
  }
}
