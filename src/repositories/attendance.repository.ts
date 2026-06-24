import { db } from "@/db";
import { attendanceLogs, employees, sites } from "@/db/schema";
import { eq, and, gte, lte, sql, isNull, desc } from "drizzle-orm";
import { toDateString } from "@/utils";

export const attendanceRepository = {
  async findTodayByEmployee(employeeId: string) {
    const today = toDateString();
    const result = await db
      .select()
      .from(attendanceLogs)
      .where(and(eq(attendanceLogs.employeeId, employeeId), eq(attendanceLogs.date, today)))
      .limit(1);
    return result[0] ?? null;
  },

  async findByDate(date: string) {
    return db
      .select({ log: attendanceLogs, employee: employees, site: sites })
      .from(attendanceLogs)
      .leftJoin(employees, eq(attendanceLogs.employeeId, employees.id))
      .leftJoin(sites, eq(attendanceLogs.siteId, sites.id))
      .where(eq(attendanceLogs.date, date))
      .orderBy(desc(attendanceLogs.checkInTime));
  },

  async findByDateRange(start: string, end: string) {
    return db
      .select({ log: attendanceLogs, employee: employees, site: sites })
      .from(attendanceLogs)
      .leftJoin(employees, eq(attendanceLogs.employeeId, employees.id))
      .leftJoin(sites, eq(attendanceLogs.siteId, sites.id))
      .where(and(gte(attendanceLogs.date, start), lte(attendanceLogs.date, end)))
      .orderBy(desc(attendanceLogs.date));
  },

  async findByEmployee(employeeId: string, limit = 30) {
    return db
      .select({ log: attendanceLogs, site: sites })
      .from(attendanceLogs)
      .leftJoin(sites, eq(attendanceLogs.siteId, sites.id))
      .where(eq(attendanceLogs.employeeId, employeeId))
      .orderBy(desc(attendanceLogs.date))
      .limit(limit);
  },

  async findBySite(siteId: string, date?: string) {
    const conditions = [eq(attendanceLogs.siteId, siteId)];
    if (date) conditions.push(eq(attendanceLogs.date, date));
    return db
      .select({ log: attendanceLogs, employee: employees })
      .from(attendanceLogs)
      .leftJoin(employees, eq(attendanceLogs.employeeId, employees.id))
      .where(and(...conditions))
      .orderBy(desc(attendanceLogs.checkInTime));
  },

  async findMissingCheckout(date?: string) {
    const d = date ?? toDateString();
    return db
      .select({ log: attendanceLogs, employee: employees, site: sites })
      .from(attendanceLogs)
      .leftJoin(employees, eq(attendanceLogs.employeeId, employees.id))
      .leftJoin(sites, eq(attendanceLogs.siteId, sites.id))
      .where(and(eq(attendanceLogs.date, d), isNull(attendanceLogs.checkOutTime)))
      .orderBy(desc(attendanceLogs.checkInTime));
  },

  async getTodayStats() {
    const today = toDateString();
    const result = await db
      .select({
        total: sql<number>`count(*)`,
        checkedIn: sql<number>`count(*) filter (where check_out_time is null and check_in_time is not null)`,
        checkedOut: sql<number>`count(*) filter (where check_out_time is not null)`,
        late: sql<number>`count(*) filter (where status = 'late')`,
      })
      .from(attendanceLogs)
      .where(eq(attendanceLogs.date, today));
    return result[0];
  },

  async getSiteWiseToday() {
    const today = toDateString();
    return db
      .select({ siteName: sites.name, count: sql<number>`count(*)` })
      .from(attendanceLogs)
      .leftJoin(sites, eq(attendanceLogs.siteId, sites.id))
      .where(eq(attendanceLogs.date, today))
      .groupBy(sites.name);
  },

  async getRecentActivity(limit = 10) {
    return db
      .select({ log: attendanceLogs, employee: employees, site: sites })
      .from(attendanceLogs)
      .leftJoin(employees, eq(attendanceLogs.employeeId, employees.id))
      .leftJoin(sites, eq(attendanceLogs.siteId, sites.id))
      .orderBy(desc(attendanceLogs.createdAt))
      .limit(limit);
  },

  async checkIn(data: {
    employeeId: string;
    siteId?: string | null;
    gpsLatitude?: number;
    gpsLongitude?: number;
    deviceInfo?: string;
    browser?: string;
    confidenceScore?: number;
    status?: string;
  }) {
    const today = toDateString();
    const [result] = await db
      .insert(attendanceLogs)
      .values({
        employeeId: data.employeeId,
        siteId: data.siteId ?? null,
        date: today,
        checkInTime: new Date(),
        gpsLatitude: data.gpsLatitude ?? null,
        gpsLongitude: data.gpsLongitude ?? null,
        deviceInfo: data.deviceInfo ?? null,
        browser: data.browser ?? null,
        confidenceScore: data.confidenceScore ?? null,
        status: (data.status as any) ?? "present",
      })
      .returning();
    return result;
  },

  async checkOut(logId: string) {
    const [result] = await db
      .update(attendanceLogs)
      .set({ checkOutTime: new Date(), updatedAt: new Date() })
      .where(eq(attendanceLogs.id, logId))
      .returning();
    return result;
  },
};
