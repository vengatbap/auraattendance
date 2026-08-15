import { db } from "@/db";
import { payrollRuns } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { PayrollRunStatus } from "../types";

export class PayrollRunRepository {
  static async create(data: {
    organizationId: string;
    payrollPeriodId: string;
    createdBy: string;
  }) {
    const [run] = await db.insert(payrollRuns)
      .values({
        organizationId: data.organizationId,
        payrollPeriodId: data.payrollPeriodId,
        createdBy: data.createdBy,
        status: "DRAFT",
      })
      .returning();
    return run;
  }

  static async findById(id: string, organizationId: string) {
    return await db.query.payrollRuns.findFirst({
      where: and(
        eq(payrollRuns.id, id),
        eq(payrollRuns.organizationId, organizationId)
      ),
    });
  }
  
  static async findByPeriodId(periodId: string, organizationId: string) {
    return await db.query.payrollRuns.findFirst({
      where: and(
        eq(payrollRuns.payrollPeriodId, periodId),
        eq(payrollRuns.organizationId, organizationId)
      ),
    });
  }

  static async updateTotals(
    id: string,
    organizationId: string,
    data: {
      employeeCount: number;
      grossTotal: string;
      deductionTotal: string;
      netTotal: string;
      updatedBy: string;
    }
  ) {
    const [updated] = await db.update(payrollRuns)
      .set({
        ...data,
      })
      .where(
        and(
          eq(payrollRuns.id, id),
          eq(payrollRuns.organizationId, organizationId)
        )
      )
      .returning();
    return updated;
  }

  static async updateStatus(
    id: string,
    organizationId: string,
    version: number,
    status: PayrollRunStatus,
    updatedBy: string
  ) {
    const updates: Partial<typeof payrollRuns.$inferInsert> = {
      status,
      updatedBy,
      version: version + 1,
    };

    if (status === "CALCULATING") updates.calculatedAt = new Date();
    if (status === "APPROVED") updates.approvedAt = new Date();
    if (status === "PAID") updates.paidAt = new Date();

    const [updated] = await db.update(payrollRuns)
      .set(updates)
      .where(
        and(
          eq(payrollRuns.id, id),
          eq(payrollRuns.organizationId, organizationId),
          eq(payrollRuns.version, version)
        )
      )
      .returning();

    return updated;
  }
}
