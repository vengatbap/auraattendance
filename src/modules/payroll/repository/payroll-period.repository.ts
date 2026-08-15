import { db } from "@/db";
import { payrollPeriods } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { PayrollPeriodStatus } from "../types";

export class PayrollPeriodRepository {
  static async create(data: {
    organizationId: string;
    name: string;
    periodStart: string;
    periodEnd: string;
    createdBy: string;
  }) {
    const [period] = await db.insert(payrollPeriods)
      .values({
        organizationId: data.organizationId,
        name: data.name,
        periodStart: data.periodStart,
        periodEnd: data.periodEnd,
        createdBy: data.createdBy,
        status: "DRAFT",
      })
      .returning();
    return period;
  }

  static async findById(id: string, organizationId: string) {
    return await db.query.payrollPeriods.findFirst({
      where: and(
        eq(payrollPeriods.id, id),
        eq(payrollPeriods.organizationId, organizationId)
      ),
    });
  }

  static async updateStatus(
    id: string,
    organizationId: string,
    version: number,
    status: PayrollPeriodStatus,
    updatedBy: string
  ) {
    const updates: Partial<typeof payrollPeriods.$inferInsert> = {
      status,
      updatedBy,
      version: version + 1,
    };

    if (status === "CALCULATING") updates.calculatedAt = new Date();
    if (status === "APPROVED") updates.approvedAt = new Date();
    if (status === "PAID") updates.paidAt = new Date();
    if (status === "LOCKED") updates.lockedAt = new Date();

    const [updated] = await db.update(payrollPeriods)
      .set(updates)
      .where(
        and(
          eq(payrollPeriods.id, id),
          eq(payrollPeriods.organizationId, organizationId),
          eq(payrollPeriods.version, version)
        )
      )
      .returning();

    return updated;
  }
}
