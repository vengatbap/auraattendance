import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { attendanceLogs, employees, sites } from "@/db/schema";
import { eq, and, gte, lte } from "drizzle-orm";
import { getSession } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const type = req.nextUrl.searchParams.get("type") || "daily";
    const date = req.nextUrl.searchParams.get("date");
    const month = req.nextUrl.searchParams.get("month");
    const siteId = req.nextUrl.searchParams.get("siteId");

    if (type === "daily" && date) {
      // Daily Attendance Report
      const logs = await db
        .select({
          employeeName: employees.name,
          employeeId: employees.employeeCode,
          checkInTime: attendanceLogs.checkInTime,
          checkOutTime: attendanceLogs.checkOutTime,
          siteName: sites.name,
        })
        .from(attendanceLogs)
        .innerJoin(employees, eq(employees.id, attendanceLogs.employeeId))
        .leftJoin(sites, eq(sites.id, attendanceLogs.siteId))
        .where(and(eq(attendanceLogs.date, date), siteId ? eq(attendanceLogs.siteId, siteId) : undefined));

      return NextResponse.json({
        type: "daily",
        date,
        data: logs.map((log) => ({
          ...log,
          hours: log.checkInTime && log.checkOutTime 
            ? ((new Date(log.checkOutTime).getTime() - new Date(log.checkInTime).getTime()) / (1000 * 60 * 60)).toFixed(2)
            : "0.00",
        })),
      });
    }

    if (type === "monthly" && month) {
      // Monthly Attendance Report
      const [year, monthNum] = month.split("-");
      const startDate = `${year}-${monthNum}-01`;
      const endDate = new Date(parseInt(year), parseInt(monthNum), 0).toISOString().split("T")[0];

      const logs = await db
        .select({
          employeeName: employees.name,
          employeeId: employees.employeeCode,
          status: attendanceLogs.status,
          checkInTime: attendanceLogs.checkInTime,
          checkOutTime: attendanceLogs.checkOutTime,
        })
        .from(attendanceLogs)
        .innerJoin(employees, eq(employees.id, attendanceLogs.employeeId))
        .where(
          and(
            gte(attendanceLogs.date, startDate),
            lte(attendanceLogs.date, endDate),
            siteId ? eq(attendanceLogs.siteId, siteId) : undefined
          )
        );

      // Aggregate by employee
      const summary: Record<string, { employeeName: string; employeeId: string; present: number; absent: number; late: number; workingHours: number }> = {};
      logs.forEach((log) => {
        if (!summary[log.employeeId]) {
          summary[log.employeeId] = {
            employeeName: log.employeeName,
            employeeId: log.employeeId,
            present: 0,
            absent: 0,
            late: 0,
            workingHours: 0,
          };
        }
        if (log.status === "present") summary[log.employeeId].present++;
        else if (log.status === "absent") summary[log.employeeId].absent++;
        else if (log.status === "late") summary[log.employeeId].late++;

        if (log.checkInTime && log.checkOutTime) {
          const hours = (new Date(log.checkOutTime).getTime() - new Date(log.checkInTime).getTime()) / (1000 * 60 * 60);
          summary[log.employeeId].workingHours += hours;
        }
      });

      return NextResponse.json({
        type: "monthly",
        month,
        data: Object.values(summary).map((emp) => ({
          ...emp,
          workingHours: emp.workingHours.toFixed(2),
        })),
      });
    }

    if (type === "site" && date) {
      // Site Attendance Report
      const logs = await db
        .select({
          siteName: sites.name,
          siteId: sites.id,
          employeeName: employees.name,
          employeeId: employees.employeeCode,
          checkInTime: attendanceLogs.checkInTime,
          checkOutTime: attendanceLogs.checkOutTime,
        })
        .from(attendanceLogs)
        .innerJoin(employees, eq(employees.id, attendanceLogs.employeeId))
        .leftJoin(sites, eq(sites.id, attendanceLogs.siteId))
        .where(eq(attendanceLogs.date, date));

      // Group by site
      const summary: Record<string, { siteName: string; siteId: string | null; todaysAttendance: number; employees: string[]; totalHours: number }> = {};
      logs.forEach((log) => {
        if (!summary[log.siteId || "unknown"]) {
          summary[log.siteId || "unknown"] = {
            siteName: log.siteName || "Unknown Site",
            siteId: log.siteId,
            todaysAttendance: 0,
            employees: [],
            totalHours: 0,
          };
        }
        summary[log.siteId || "unknown"].todaysAttendance++;
        summary[log.siteId || "unknown"].employees.push(log.employeeName);

        if (log.checkInTime && log.checkOutTime) {
          const hours = (new Date(log.checkOutTime).getTime() - new Date(log.checkInTime).getTime()) / (1000 * 60 * 60);
          summary[log.siteId || "unknown"].totalHours += hours;
        }
      });

      return NextResponse.json({
        type: "site",
        date,
        data: Object.values(summary).map((site) => ({
          ...site,
          totalHours: site.totalHours.toFixed(2),
        })),
      });
    }

    return NextResponse.json({ error: "Invalid report parameters" }, { status: 400 });
  } catch (error) {
    console.error("Error generating report:", error);
    return NextResponse.json({ error: "Failed to generate report" }, { status: 500 });
  }
}
