import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { attendanceLogs, employees, sites } from "@/db/schema";
import { eq, and, gte, lte } from "drizzle-orm";
import { getSession } from "@/lib/auth";
import ExcelJS from "exceljs";

function convertToCSV(data: Record<string, string | number | boolean | Date | null | undefined>[]): string {
  if (data.length === 0) return "";

  const headers = Object.keys(data[0]);
  const csv = [
    headers.join(","),
    ...data.map((row) =>
      headers
        .map((header) => {
          const value = row[header];
          if (value === null || value === undefined) return "";
          if (typeof value === "string" && /[",\n]/.test(value)) {
            return `"${value.replaceAll('"', '""')}"`;
          }
          return value;
        })
        .join(",")
    ),
  ];

  return csv.join("\n");
}

async function convertToExcel(data: Record<string, string | number | boolean | Date | null | undefined>[]): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "AURA Attendance";
  workbook.created = new Date();

  const worksheet = workbook.addWorksheet("Report");
  const headers = data.length > 0 ? Object.keys(data[0]) : ["No Data"];
  worksheet.columns = headers.map((header) => ({
    header,
    key: header,
    width: Math.max(14, header.length + 4),
  }));

  data.forEach((row) => worksheet.addRow(row));
  worksheet.getRow(1).font = { bold: true, color: { argb: "FFFFFFFF" } };
  worksheet.getRow(1).fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FF2563EB" },
  };
  worksheet.views = [{ state: "frozen", ySplit: 1 }];

  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer);
}

export async function GET(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session || !session.organizationId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const orgId = session.organizationId;
    const type = req.nextUrl.searchParams.get("type") || "daily";
    const date = req.nextUrl.searchParams.get("date");
    const month = req.nextUrl.searchParams.get("month");
    const siteId = req.nextUrl.searchParams.get("siteId");
    const format = req.nextUrl.searchParams.get("format") || "csv";

    let data: Record<string, string | number | boolean | Date | null | undefined>[] = [];
    let filename = "report";

    const filterSite = siteId && siteId !== "all" ? eq(attendanceLogs.siteId, siteId) : undefined;

    if (type === "daily" && date) {
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
        .where(
          and(
            eq(attendanceLogs.organizationId, orgId),
            eq(attendanceLogs.date, date),
            filterSite
          )
        );

      data = logs.map((log) => ({
        Employee: log.employeeName,
        "Employee ID": log.employeeId,
        "Check In": log.checkInTime ? new Date(log.checkInTime).toLocaleString() : "-",
        "Check Out": log.checkOutTime ? new Date(log.checkOutTime).toLocaleString() : "-",
        Hours: log.checkInTime && log.checkOutTime
          ? ((new Date(log.checkOutTime).getTime() - new Date(log.checkInTime).getTime()) / (1000 * 60 * 60)).toFixed(2)
          : "0",
        Site: log.siteName || "-",
      }));

      filename = `daily-attendance-${date}`;
    } else if (type === "monthly" && month) {
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
            eq(attendanceLogs.organizationId, orgId),
            gte(attendanceLogs.date, startDate),
            lte(attendanceLogs.date, endDate),
            filterSite
          )
        );

      const summary: Record<string, { employeeName: string; present: number; absent: number; late: number; workingHours: number }> = {};
      logs.forEach((log) => {
        if (!summary[log.employeeId]) {
          summary[log.employeeId] = {
            employeeName: log.employeeName,
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

      data = Object.values(summary).map((emp) => ({
        Employee: emp.employeeName,
        Present: emp.present,
        Absent: emp.absent,
        Late: emp.late,
        "Working Hours": emp.workingHours.toFixed(2),
      }));

      filename = `monthly-attendance-${month}`;
    } else if (type === "site" && date) {
      const logs = await db
        .select({
          employeeName: employees.name,
          employeeId: employees.employeeCode,
          checkInTime: attendanceLogs.checkInTime,
          checkOutTime: attendanceLogs.checkOutTime,
          status: attendanceLogs.status,
          siteName: sites.name,
        })
        .from(attendanceLogs)
        .innerJoin(employees, eq(employees.id, attendanceLogs.employeeId))
        .leftJoin(sites, eq(sites.id, attendanceLogs.siteId))
        .where(
          and(
            eq(attendanceLogs.organizationId, orgId),
            eq(attendanceLogs.date, date),
            filterSite
          )
        );

      data = logs.map((log) => ({
        Site: log.siteName || "-",
        Employee: log.employeeName,
        "Employee ID": log.employeeId,
        Status: log.status,
        "Check In": log.checkInTime ? new Date(log.checkInTime).toLocaleString() : "-",
        "Check Out": log.checkOutTime ? new Date(log.checkOutTime).toLocaleString() : "-",
        Hours: log.checkInTime && log.checkOutTime
          ? ((new Date(log.checkOutTime).getTime() - new Date(log.checkInTime).getTime()) / (1000 * 60 * 60)).toFixed(2)
          : "0",
      }));

      filename = `site-attendance-${date}`;
    } else if (type === "employee") {
      const parsedYear = month ? parseInt(month.split("-")[0]) : new Date().getFullYear();
      const parsedMonth = month ? parseInt(month.split("-")[1]) : new Date().getMonth() + 1;
      const endLimitDate = new Date(parsedYear, parsedMonth, 0).toISOString().split("T")[0];

      const logs = await db
        .select({
          employeeName: employees.name,
          employeeId: employees.employeeCode,
          governmentId: employees.governmentId,
          date: attendanceLogs.date,
          checkInTime: attendanceLogs.checkInTime,
          checkOutTime: attendanceLogs.checkOutTime,
          status: attendanceLogs.status,
          siteName: sites.name,
        })
        .from(attendanceLogs)
        .innerJoin(employees, eq(employees.id, attendanceLogs.employeeId))
        .leftJoin(sites, eq(sites.id, attendanceLogs.siteId))
        .where(
          and(
            eq(attendanceLogs.organizationId, orgId),
            month ? gte(attendanceLogs.date, `${month}-01`) : undefined,
            month ? lte(attendanceLogs.date, endLimitDate) : undefined,
            filterSite
          )
        );

      data = logs.map((log) => ({
        Employee: log.employeeName,
        "Employee ID": log.employeeId,
        "Government ID": log.governmentId || "-",
        Date: log.date,
        Site: log.siteName || "-",
        Status: log.status,
        "Check In": log.checkInTime ? new Date(log.checkInTime).toLocaleString() : "-",
        "Check Out": log.checkOutTime ? new Date(log.checkOutTime).toLocaleString() : "-",
      }));

      filename = `employee-attendance-${month || "all"}`;
    }

    const isExcel = format === "excel" || format === "xlsx";
    const content = isExcel ? new Uint8Array(await convertToExcel(data)) : convertToCSV(data);
    const mimeType = isExcel
      ? "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
      : "text/csv; charset=utf-8";
    const extension = isExcel ? "xlsx" : "csv";

    return new NextResponse(content, {
      status: 200,
      headers: {
        "Content-Type": mimeType,
        "Content-Disposition": `attachment; filename="${filename}.${extension}"`,
      },
    });
  } catch (error) {
    console.error("Error exporting report:", error);
    return NextResponse.json({ error: "Failed to export report" }, { status: 500 });
  }
}
