import { db } from "@/db";
import { leaveBalances, leaveTypes, employees } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { LeaveBalance, NewLeaveBalance } from "../types";

export class LeaveBalanceRepository {
  static async create(data: NewLeaveBalance): Promise<LeaveBalance> {
    const [result] = await db.insert(leaveBalances).values(data).returning();
    return result;
  }

  static async findByEmployeeAndType(organizationId: string, employeeId: string, leaveTypeId: string, year: number): Promise<LeaveBalance | null> {
    const [result] = await db
      .select()
      .from(leaveBalances)
      .where(
        and(
          eq(leaveBalances.organizationId, organizationId),
          eq(leaveBalances.employeeId, employeeId),
          eq(leaveBalances.leaveTypeId, leaveTypeId),
          eq(leaveBalances.year, year)
        )
      )
      .limit(1);
    return result || null;
  }

  static async listByEmployee(organizationId: string, employeeId: string, year: number) {
    return db
      .select({
        balance: leaveBalances,
        type: leaveTypes
      })
      .from(leaveBalances)
      .innerJoin(leaveTypes, eq(leaveBalances.leaveTypeId, leaveTypes.id))
      .where(
        and(
          eq(leaveBalances.organizationId, organizationId),
          eq(leaveBalances.employeeId, employeeId),
          eq(leaveBalances.year, year)
        )
      );
  }

  static async listAll(organizationId: string, year: number) {
    return db
      .select({
        balance: leaveBalances,
        type: leaveTypes,
        employee: employees
      })
      .from(leaveBalances)
      .innerJoin(leaveTypes, eq(leaveBalances.leaveTypeId, leaveTypes.id))
      .innerJoin(employees, eq(leaveBalances.employeeId, employees.id))
      .where(
        and(
          eq(leaveBalances.organizationId, organizationId),
          eq(leaveBalances.year, year)
        )
      );
  }

  /**
   * Transactional update of a leave balance with optimistic version check.
   */
  static async updateBalance(
    dbClient: Parameters<Parameters<typeof db.transaction>[0]>[0], 
    id: string, 
    expectedVersion: number, 
    updates: Partial<NewLeaveBalance>
  ): Promise<LeaveBalance | null> {
    const [result] = await dbClient
      .update(leaveBalances)
      .set({ 
        ...updates, 
        version: expectedVersion + 1,
        updatedAt: new Date()
      })
      .where(
        and(
          eq(leaveBalances.id, id),
          eq(leaveBalances.version, expectedVersion)
        )
      )
      .returning();
      
    return result || null;
  }
}
