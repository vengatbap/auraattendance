import { db } from "@/db";
import { payslips } from "@/db/schema";
import { eq, and } from "drizzle-orm";

export class PayslipRepository {
  static async insertBatch(
    organizationId: string,
    runId: string,
    items: (typeof payslips.$inferInsert)[]
  ) {
    if (items.length === 0) return [];
    
    const values = items.map((i) => ({
      organizationId,
      payrollRunId: runId,
      employeeId: i.employeeId,
      payrollItemId: i.payrollItemId,
      payslipNumber: i.payslipNumber,
      periodStart: i.periodStart,
      periodEnd: i.periodEnd,
      grossPay: i.grossPay,
      totalDeductions: i.totalDeductions,
      netPay: i.netPay,
      currency: i.currency,
      status: "LOCKED",
      createdBy: i.createdBy,
    }));

    return await db.insert(payslips).values(values).returning();
  }

  static async findByRunId(organizationId: string, runId: string) {
    return await db.query.payslips.findMany({
      where: and(
        eq(payslips.payrollRunId, runId),
        eq(payslips.organizationId, organizationId)
      ),
      with: {
        employee: true,
      }
    });
  }

  static async findById(organizationId: string, id: string) {
    return await db.query.payslips.findFirst({
      where: and(
        eq(payslips.id, id),
        eq(payslips.organizationId, organizationId)
      ),
      with: {
        employee: true,
        run: true,
        item: true,
      }
    });
  }
}
