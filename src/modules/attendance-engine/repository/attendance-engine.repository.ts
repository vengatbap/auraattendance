import { db } from "@/db";
import { organizations, employees, faceProfiles, sites, attendanceLogs, attendanceEvents } from "@/db/schema";
import { eq, and, isNull, sql, lt, desc } from "drizzle-orm";

export class AttendanceEngineRepository {
  static async findOrganizationById(id: string) {
    const [result] = await db
      .select()
      .from(organizations)
      .where(eq(organizations.id, id))
      .limit(1);
    return result ?? null;
  }

  static async findEventByIdempotency(organizationId: string, clientEventId: string) {
    const [result] = await db
      .select()
      .from(attendanceEvents)
      .where(
        and(
          eq(attendanceEvents.organizationId, organizationId),
          eq(attendanceEvents.clientEventId, clientEventId)
        )
      )
      .limit(1);
    return result ?? null;
  }

  static async findEmployeeProfiles(organizationId: string) {
    return db
      .select({
        employeeId: faceProfiles.employeeId,
        embedding: faceProfiles.embedding,
      })
      .from(faceProfiles)
      .where(eq(faceProfiles.organizationId, organizationId));
  }

  static async findEmployeeById(organizationId: string, employeeId: string) {
    const [result] = await db
      .select()
      .from(employees)
      .where(
        and(
          eq(employees.id, employeeId),
          eq(employees.organizationId, organizationId),
          isNull(employees.deletedAt)
        )
      )
      .limit(1);
    return result ?? null;
  }

  static async findEmployeeByCode(organizationId: string, employeeCode: string) {
    const [result] = await db
      .select()
      .from(employees)
      .where(
        and(
          eq(employees.employeeCode, employeeCode),
          eq(employees.organizationId, organizationId),
          isNull(employees.deletedAt)
        )
      )
      .limit(1);
    return result ?? null;
  }

  static async findActiveSites(organizationId: string) {
    return db
      .select()
      .from(sites)
      .where(
        and(
          eq(sites.organizationId, organizationId),
          eq(sites.status, "active"),
          isNull(sites.deletedAt)
        )
      );
  }

  static async findOpenAttendanceLog(organizationId: string, employeeId: string, dateString: string) {
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

  static async findPendingPreviousDays(organizationId: string, employeeId: string, todayDateString: string) {
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

  static async findRecentEvents(organizationId: string, employeeId: string, dateString: string) {
    return db
      .select()
      .from(attendanceEvents)
      .where(
        and(
          eq(attendanceEvents.organizationId, organizationId),
          eq(attendanceEvents.employeeId, employeeId),
          eq(sql`CAST(${attendanceEvents.receivedAt} AS DATE)`, sql`CAST(${dateString} AS DATE)`)
        )
      )
      .orderBy(desc(attendanceEvents.receivedAt))
      .limit(5);
  }

  /**
   * Transactionally persists the raw attendance event evidence, and
   * creates/updates the derived operational session attendance logs.
   * If updates to logs fail, the transaction rolls back.
   */
  static async persistPunchTransaction<T>(
    eventInsert: typeof attendanceEvents.$inferInsert,
    logOperation?: () => Promise<T>
  ) {
    let insertedEvent: typeof attendanceEvents.$inferSelect | null = null;
    try {
      // 1. Insert raw evidence event
      const [result] = await db
        .insert(attendanceEvents)
        .values(eventInsert)
        .returning();
      insertedEvent = result;

      let insertedLog: T | null = null;

      // 2. Execute log mutation
      if (logOperation) {
        insertedLog = await logOperation();
      }

      return {
        event: insertedEvent,
        log: insertedLog,
      };
    } catch (err) {
      if (insertedEvent) {
        // Rollback inserted event manually on state failure
        await db.delete(attendanceEvents).where(eq(attendanceEvents.id, insertedEvent.id));
      }
      throw err;
    }
  }

  static async persistEventOnly(eventInsert: typeof attendanceEvents.$inferInsert) {
    const [insertedEvent] = await db
      .insert(attendanceEvents)
      .values(eventInsert)
      .returning();
    return insertedEvent;
  }
}
