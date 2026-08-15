import { db } from "@/db";
import { attendanceLogs } from "@/db/schema";
import { eq, and, gte, lte } from "drizzle-orm";

export interface AttendancePayrollSummary {
  employeeId: string;
  periodStart: Date;
  periodEnd: Date;
  scheduledDays: number;
  presentDays: number;
  absentDays: number;
  overtimeHours: number;
  missingCheckoutDays: number;
  attendanceWarningDays: number;
}

export class AttendanceSummaryService {
  /**
   * Summarizes attendance logs for a specific employee and time period,
   * providing the exact deterministic values required by the Payroll Engine.
   */
  static async getBatchAttendancePayrollSummaries(
    organizationId: string,
    employeeIds: string[],
    periodStart: string, // YYYY-MM-DD
    periodEnd: string    // YYYY-MM-DD
  ): Promise<Record<string, AttendancePayrollSummary>> {
    const logs = await db.query.attendanceLogs.findMany({
      where: and(
        eq(attendanceLogs.organizationId, organizationId),
        gte(attendanceLogs.date, periodStart),
        lte(attendanceLogs.date, periodEnd)
      )
    });

    // Filter logs in memory to just the requested employees to avoid huge IN clauses
    const requestedEmployees = new Set(employeeIds);
    const relevantLogs = logs.filter(log => requestedEmployees.has(log.employeeId));

    const summaries: Record<string, AttendancePayrollSummary> = {};
    for (const empId of employeeIds) {
      summaries[empId] = {
        employeeId: empId,
        periodStart: new Date(periodStart),
        periodEnd: new Date(periodEnd),
        scheduledDays: 0,
        presentDays: 0,
        absentDays: 0,
        overtimeHours: 0,
        missingCheckoutDays: 0,
        attendanceWarningDays: 0,
      };
    }

    const workedMsMap: Record<string, number> = {};

    for (const log of relevantLogs) {
      const empId = log.employeeId;
      const summary = summaries[empId];

      if (log.status === "present" || log.status === "late") {
        summary.presentDays++;
      } else if (log.status === "absent") {
        summary.absentDays++;
      }

      if (log.checkInTime && !log.checkOutTime) {
        summary.missingCheckoutDays++;
      }

      if (log.flags && (log.flags as string[]).includes("LATE_CHECKIN")) {
        summary.attendanceWarningDays++;
      }

      if (log.checkInTime && log.checkOutTime) {
        const checkIn = new Date(log.checkInTime).getTime();
        const checkOut = new Date(log.checkOutTime).getTime();
        workedMsMap[empId] = (workedMsMap[empId] || 0) + (checkOut - checkIn);
      }
    }

    for (const empId of employeeIds) {
      const summary = summaries[empId];
      const totalWorkedMs = workedMsMap[empId] || 0;
      const totalWorkedHours = totalWorkedMs / (1000 * 60 * 60);
      const expectedHours = summary.presentDays * 8;
      const overtimeHours = totalWorkedHours > expectedHours ? totalWorkedHours - expectedHours : 0;
      
      summary.overtimeHours = parseFloat(overtimeHours.toFixed(2));
      summary.scheduledDays = summary.presentDays + summary.absentDays;
    }

    return summaries;
  }

  static async getAttendancePayrollSummary(
    organizationId: string,
    employeeId: string,
    periodStart: string, // YYYY-MM-DD
    periodEnd: string    // YYYY-MM-DD
  ): Promise<AttendancePayrollSummary> {
    const logs = await db.query.attendanceLogs.findMany({
      where: and(
        eq(attendanceLogs.organizationId, organizationId),
        eq(attendanceLogs.employeeId, employeeId),
        gte(attendanceLogs.date, periodStart),
        lte(attendanceLogs.date, periodEnd)
      )
    });

    let presentDays = 0;
    let absentDays = 0;
    let missingCheckoutDays = 0;
    let attendanceWarningDays = 0;
    let totalWorkedMs = 0;

    for (const log of logs) {
      if (log.status === "present" || log.status === "late") {
        presentDays++;
      } else if (log.status === "absent") {
        absentDays++;
      }

      if (log.checkInTime && !log.checkOutTime) {
        missingCheckoutDays++;
      }

      if (log.flags && (log.flags as string[]).includes("LATE_CHECKIN")) {
        attendanceWarningDays++;
      }

      if (log.checkInTime && log.checkOutTime) {
        const checkIn = new Date(log.checkInTime).getTime();
        const checkOut = new Date(log.checkOutTime).getTime();
        totalWorkedMs += (checkOut - checkIn);
      }
    }

    // Convert ms to hours
    const totalWorkedHours = totalWorkedMs / (1000 * 60 * 60);

    // Simple overtime calculation: anything above 8 hours per present day is overtime.
    // In a real system, this would be based on shifts, but this is a V1 placeholder
    // adhering to the payroll integration contract.
    const expectedHours = presentDays * 8; 
    const overtimeHours = totalWorkedHours > expectedHours ? totalWorkedHours - expectedHours : 0;

    // Scheduled days is a naive sum for now, typically derived from employee's working days config
    // but Attendance engine just supplies what it knows about recorded/missed days.
    const scheduledDays = presentDays + absentDays;

    return {
      employeeId,
      periodStart: new Date(periodStart),
      periodEnd: new Date(periodEnd),
      scheduledDays,
      presentDays,
      absentDays,
      overtimeHours: parseFloat(overtimeHours.toFixed(2)),
      missingCheckoutDays,
      attendanceWarningDays,
    };
  }
}
