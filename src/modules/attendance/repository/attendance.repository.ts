import { db } from "@/db";
import { attendanceLogs } from "@/db/schema";
import { and, eq, lt, isNull } from "drizzle-orm";
import { AttendanceLogEntity } from "../types";

export class AttendanceRepository {
  async findTodayByEmployee(
    organizationId: string,
    employeeId: string,
    dateString: string
  ): Promise<AttendanceLogEntity | null> {
    const [result] = await db
      .select()
      .from(attendanceLogs)
      .where(
        and(
          eq(attendanceLogs.organizationId, organizationId),
          eq(attendanceLogs.employeeId, employeeId),
          eq(attendanceLogs.date, dateString)
        )
      )
      .limit(1);
    return result ?? null;
  }

  async findPendingPreviousDays(
    organizationId: string,
    employeeId: string,
    todayDateString: string
  ): Promise<AttendanceLogEntity[]> {
    return db
      .select()
      .from(attendanceLogs)
      .where(
        and(
          eq(attendanceLogs.organizationId, organizationId),
          eq(attendanceLogs.employeeId, employeeId),
          isNull(attendanceLogs.checkOutTime),
          lt(attendanceLogs.date, todayDateString)
        )
      );
  }

  async create(
    organizationId: string,
    data: typeof attendanceLogs.$inferInsert
  ): Promise<AttendanceLogEntity> {
    const [result] = await db
      .insert(attendanceLogs)
      .values({
        ...data,
        organizationId,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();
    return result;
  }

  async update(
    id: string,
    organizationId: string,
    data: Partial<typeof attendanceLogs.$inferInsert>
  ): Promise<AttendanceLogEntity> {
    const [result] = await db
      .update(attendanceLogs)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(attendanceLogs.id, id),
          eq(attendanceLogs.organizationId, organizationId)
        )
      )
      .returning();
    return result;
  }
}

export const attendanceRepository = new AttendanceRepository();
