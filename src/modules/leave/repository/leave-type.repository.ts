import { db } from "@/db";
import { leaveTypes } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { LeaveType, NewLeaveType } from "../types";

export class LeaveTypeRepository {
  static async create(data: NewLeaveType): Promise<LeaveType> {
    const [result] = await db.insert(leaveTypes).values(data).returning();
    return result;
  }

  static async update(id: string, organizationId: string, data: Partial<NewLeaveType>): Promise<LeaveType | null> {
    const [result] = await db
      .update(leaveTypes)
      .set({ ...data, updatedAt: new Date() })
      .where(and(eq(leaveTypes.id, id), eq(leaveTypes.organizationId, organizationId)))
      .returning();
    return result || null;
  }

  static async findById(id: string, organizationId: string): Promise<LeaveType | null> {
    const [result] = await db
      .select()
      .from(leaveTypes)
      .where(and(eq(leaveTypes.id, id), eq(leaveTypes.organizationId, organizationId)))
      .limit(1);
    return result || null;
  }

  static async findByCode(code: string, organizationId: string): Promise<LeaveType | null> {
    const [result] = await db
      .select()
      .from(leaveTypes)
      .where(and(eq(leaveTypes.code, code), eq(leaveTypes.organizationId, organizationId)))
      .limit(1);
    return result || null;
  }

  static async list(organizationId: string): Promise<LeaveType[]> {
    return db
      .select()
      .from(leaveTypes)
      .where(eq(leaveTypes.organizationId, organizationId));
  }
}
