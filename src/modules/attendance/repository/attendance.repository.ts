import { db } from "@/db";
import { attendanceLogs, users, sites, employees, faceProfiles, organizations } from "@/db/schema";
import { and, eq, lt, isNull, desc, sql } from "drizzle-orm";
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

  async getDashboardData(orgId: string, todayDateString: string) {
    const [
      adminCount,
      siteCount,
      employeeCount,
      todayAttendance,
      recentPunches,
      faceCount,
      orgDetails,
    ] = await Promise.all([
      db
        .select({ count: sql<number>`count(*)` })
        .from(users)
        .where(eq(users.organizationId, orgId))
        .then((res) => Number(res[0].count)),
      db
        .select({ count: sql<number>`count(*)` })
        .from(sites)
        .where(and(eq(sites.organizationId, orgId), isNull(sites.deletedAt)))
        .then((res) => Number(res[0].count)),
      db
        .select({ count: sql<number>`count(*)` })
        .from(employees)
        .where(and(eq(employees.organizationId, orgId), isNull(employees.deletedAt)))
        .then((res) => Number(res[0].count)),
      db
        .select()
        .from(attendanceLogs)
        .where(and(eq(attendanceLogs.organizationId, orgId), eq(attendanceLogs.date, todayDateString))),
      db
        .select({
          id: attendanceLogs.id,
          employeeName: employees.name,
          employeeCode: employees.employeeCode,
          checkInTime: attendanceLogs.checkInTime,
          checkOutTime: attendanceLogs.checkOutTime,
          status: attendanceLogs.status,
        })
        .from(attendanceLogs)
        .innerJoin(employees, eq(attendanceLogs.employeeId, employees.id))
        .where(eq(attendanceLogs.organizationId, orgId))
        .orderBy(desc(attendanceLogs.createdAt))
        .limit(5),
      db
        .select({ count: sql<number>`count(*)` })
        .from(faceProfiles)
        .where(eq(faceProfiles.organizationId, orgId))
        .then((res) => Number(res[0].count)),
      db
        .select()
        .from(organizations)
        .where(eq(organizations.id, orgId))
        .limit(1)
        .then((res) => res[0]),
    ]);

    return {
      adminCount,
      siteCount,
      employeeCount,
      todayAttendance,
      recentPunches,
      faceCount,
      orgDetails,
    };
  }
}

export const attendanceRepository = new AttendanceRepository();
