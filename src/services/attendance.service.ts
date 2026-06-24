import { attendanceRepository } from "@/repositories/attendance.repository";
import { siteRepository } from "@/repositories/site.repository";
import { employeeRepository } from "@/repositories/employee.repository";
import { faceRepository } from "@/repositories/face.repository";
import { matchEmbedding, detectSite, toDateString } from "@/utils";
import { db } from "@/db";
import { employees } from "@/db/schema";
import { sql } from "drizzle-orm";

export const attendanceService = {
  async recognize(opts: {
    embedding: number[];
    latitude?: number;
    longitude?: number;
    deviceInfo?: string;
    browser?: string;
    type: "checkin" | "checkout";
  }) {
    // 1. Match embedding
    const profiles = await faceRepository.getAllEmbeddings();
    const match = matchEmbedding(
      opts.embedding,
      profiles.map((p) => ({ employeeId: p.employeeId, embedding: p.embedding as number[] }))
    );
    if (!match) return { matched: false };

    const employee = await employeeRepository.findById(match.employeeId);
    if (!employee) return { matched: false };

    // 2. Detect site from GPS
    let site = null;
    if (opts.latitude !== undefined && opts.longitude !== undefined) {
      const allSites = await siteRepository.findActive();
      site = detectSite(opts.latitude, opts.longitude, allSites);
    }

    // 3. Check if already has attendance today
    const existing = await attendanceRepository.findTodayByEmployee(match.employeeId);

    if (opts.type === "checkin") {
      if (existing) {
        return { matched: true, employee, site, alreadyCheckedIn: true, attendanceLog: existing };
      }
      // Determine late status (default working hours 9am)
      const hour = new Date().getHours();
      const status = hour >= 9 ? "late" : "present";
      const log = await attendanceRepository.checkIn({
        employeeId: match.employeeId,
        siteId: site?.id ?? null,
        gpsLatitude: opts.latitude,
        gpsLongitude: opts.longitude,
        deviceInfo: opts.deviceInfo,
        browser: opts.browser,
        confidenceScore: match.score,
        status,
      });
      return { matched: true, employee, site, attendanceLog: log, confidenceScore: match.score };
    } else {
      if (!existing) return { matched: true, employee, site, noCheckIn: true };
      if (existing.checkOutTime) return { matched: true, employee, site, alreadyCheckedOut: true, attendanceLog: existing };
      const log = await attendanceRepository.checkOut(existing.id);
      return { matched: true, employee, site, attendanceLog: log, confidenceScore: match.score };
    }
  },

  async getTodayStats() {
    const stats = await attendanceRepository.getTodayStats();
    const siteWise = await attendanceRepository.getSiteWiseToday();
    const totalEmployees = await db.select({ count: sql<number>`count(*)` }).from(employees);
    const recent = await attendanceRepository.getRecentActivity(10);
    return {
      totalEmployees: Number(totalEmployees[0].count),
      presentToday: Number(stats.total),
      checkedIn: Number(stats.checkedIn),
      checkedOut: Number(stats.checkedOut),
      lateToday: Number(stats.late),
      absentToday: Number(totalEmployees[0].count) - Number(stats.total),
      siteWise: siteWise.map((s) => ({ siteName: s.siteName ?? "Unknown", count: Number(s.count) })),
      recentActivity: recent,
    };
  },

  async getDaily(date: string) {
    return attendanceRepository.findByDate(date);
  },

  async getMonthly(year: number, month: number) {
    const start = `${year}-${String(month).padStart(2, "0")}-01`;
    const end = new Date(year, month, 0).toISOString().split("T")[0];
    return attendanceRepository.findByDateRange(start, end);
  },

  async getByEmployee(employeeId: string) {
    return attendanceRepository.findByEmployee(employeeId);
  },

  async getBySite(siteId: string, date?: string) {
    return attendanceRepository.findBySite(siteId, date);
  },

  async getMissingCheckout(date?: string) {
    return attendanceRepository.findMissingCheckout(date);
  },
};
