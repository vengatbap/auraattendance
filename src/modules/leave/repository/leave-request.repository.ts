import { db } from "@/db";
import { leaveRequests, employees, leaveTypes } from "@/db/schema";
import { eq, and, desc, asc, gte, lte, inArray, or } from "drizzle-orm";
import { LeaveRequest, NewLeaveRequest } from "../types";

export class LeaveRequestRepository {
  static async create(data: NewLeaveRequest): Promise<LeaveRequest> {
    const [result] = await db.insert(leaveRequests).values(data).returning();
    return result;
  }

  static async findById(id: string, organizationId: string): Promise<LeaveRequest | null> {
    const [result] = await db
      .select()
      .from(leaveRequests)
      .where(and(eq(leaveRequests.id, id), eq(leaveRequests.organizationId, organizationId)))
      .limit(1);
    return result || null;
  }

  static async updateStatus(
    dbClient: Parameters<Parameters<typeof db.transaction>[0]>[0],
    id: string,
    organizationId: string,
    expectedVersion: number,
    updates: Partial<NewLeaveRequest>
  ): Promise<LeaveRequest | null> {
    const [result] = await dbClient
      .update(leaveRequests)
      .set({
        ...updates,
        version: expectedVersion + 1,
        updatedAt: new Date()
      })
      .where(
        and(
          eq(leaveRequests.id, id),
          eq(leaveRequests.organizationId, organizationId),
          eq(leaveRequests.version, expectedVersion)
        )
      )
      .returning();
    return result || null;
  }

  static async list(organizationId: string, filters?: { employeeId?: string; status?: string; startDate?: string; endDate?: string }) {
    let query = db
      .select({
        request: leaveRequests,
        employee: employees,
        type: leaveTypes
      })
      .from(leaveRequests)
      .innerJoin(employees, eq(leaveRequests.employeeId, employees.id))
      .innerJoin(leaveTypes, eq(leaveRequests.leaveTypeId, leaveTypes.id))
      .where(eq(leaveRequests.organizationId, organizationId))
      .$dynamic();

    if (filters?.employeeId) {
      query = query.where(eq(leaveRequests.employeeId, filters.employeeId));
    }
    if (filters?.status) {
      query = query.where(eq(leaveRequests.status, filters.status));
    }
    if (filters?.startDate) {
      query = query.where(gte(leaveRequests.startDate, filters.startDate));
    }
    if (filters?.endDate) {
      query = query.where(lte(leaveRequests.endDate, filters.endDate));
    }

    return query.orderBy(desc(leaveRequests.createdAt));
  }
  
  static async findOverlappingApproved(organizationId: string, employeeId: string, startDate: string, endDate: string) {
    return db
      .select()
      .from(leaveRequests)
      .where(
        and(
          eq(leaveRequests.organizationId, organizationId),
          eq(leaveRequests.employeeId, employeeId),
          inArray(leaveRequests.status, ["APPROVED", "PENDING"]),
          or(
            and(lte(leaveRequests.startDate, endDate), gte(leaveRequests.endDate, startDate))
          )
        )
      );
  }
}
