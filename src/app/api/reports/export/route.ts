import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { attendanceLogs, employees, sites, leaveRequests, leaveTypes, payrollItems, payrollRuns, payrollPeriods } from "@/db/schema";
import { eq, and, gte, lte } from "drizzle-orm";
import { getSession } from "@/lib/auth";
import { PermissionService } from "@/lib/rbac";
import { createApiResponse } from "@/lib/api-response";
import { FeatureService, FeatureRegistry } from "@/lib/features";

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

export async function GET(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session || !session.organizationId) {
      return createApiResponse({ success: false, message: "Unauthorized", status: 401 });
    }

    if (PermissionService.cannot(session, "report.export")) {
      return createApiResponse({ success: false, message: "Forbidden: insufficient permissions", status: 403 });
    }

    const isFeatureEnabled = await FeatureService.isEnabled(session.organizationId, FeatureRegistry.REPORTS);
    if (!isFeatureEnabled) {
      return createApiResponse({
        success: false,
        message: "Forbidden: reports feature is disabled for this organization",
        status: 403,
      });
    }

    const orgId = session.organizationId;
    const domain = req.nextUrl.searchParams.get("domain");
    const startDate = req.nextUrl.searchParams.get("startDate");
    const endDate = req.nextUrl.searchParams.get("endDate");
    const siteId = req.nextUrl.searchParams.get("siteId");
    const employeeId = req.nextUrl.searchParams.get("employeeId");

    let data: Record<string, string | number | boolean | Date | null | undefined>[] = [];
    let filename = "export";

    if (!startDate || !endDate) {
      return createApiResponse({ success: false, message: "Start date and end date are required", status: 400 });
    }

    if (domain === "attendance") {
      const filterSite = siteId ? eq(attendanceLogs.siteId, siteId) : undefined;
      const filterEmp = employeeId ? eq(attendanceLogs.employeeId, employeeId) : undefined;

      const logs = await db
        .select({
          employeeName: employees.name,
          employeeCode: employees.employeeCode,
          date: attendanceLogs.date,
          status: attendanceLogs.status,
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
            gte(attendanceLogs.date, startDate),
            lte(attendanceLogs.date, endDate),
            filterSite,
            filterEmp
          )
        );

      data = logs.map((log) => ({
        "Employee": log.employeeName,
        "Employee Code": log.employeeCode,
        "Date": log.date,
        "Status": log.status,
        "Check In": log.checkInTime ? new Date(log.checkInTime).toLocaleString() : "-",
        "Check Out": log.checkOutTime ? new Date(log.checkOutTime).toLocaleString() : "-",
        "Site": log.siteName || "-",
      }));
      filename = `attendance-${startDate}-to-${endDate}`;

    } else if (domain === "leave") {
      const filterEmp = employeeId ? eq(leaveRequests.employeeId, employeeId) : undefined;

      const leaves = await db
        .select({
          employeeName: employees.name,
          employeeCode: employees.employeeCode,
          leaveType: leaveTypes.name,
          startDate: leaveRequests.startDate,
          endDate: leaveRequests.endDate,
          requestedDays: leaveRequests.requestedDays,
          status: leaveRequests.status,
        })
        .from(leaveRequests)
        .innerJoin(employees, eq(employees.id, leaveRequests.employeeId))
        .innerJoin(leaveTypes, eq(leaveTypes.id, leaveRequests.leaveTypeId))
        .where(
          and(
            eq(leaveRequests.organizationId, orgId),
            gte(leaveRequests.startDate, startDate),
            lte(leaveRequests.endDate, endDate),
            filterEmp
          )
        );

      data = leaves.map((lv) => ({
        "Employee": lv.employeeName,
        "Employee Code": lv.employeeCode,
        "Leave Type": lv.leaveType,
        "Start Date": lv.startDate,
        "End Date": lv.endDate,
        "Days": lv.requestedDays,
        "Status": lv.status,
      }));
      filename = `leaves-${startDate}-to-${endDate}`;

    } else if (domain === "payroll") {
      const filterEmp = employeeId ? eq(payrollItems.employeeId, employeeId) : undefined;

      const payroll = await db
        .select({
          employeeName: employees.name,
          employeeCode: employees.employeeCode,
          periodName: payrollPeriods.name,
          basicSalary: payrollItems.basicSalary,
          presentDays: payrollItems.presentDays,
          absentDays: payrollItems.absentDays,
          overtimeAmount: payrollItems.overtimeAmount,
          allowanceAmount: payrollItems.allowanceAmount,
          deductionAmount: payrollItems.deductionAmount,
          grossPay: payrollItems.grossPay,
          netPay: payrollItems.netPay,
        })
        .from(payrollItems)
        .innerJoin(payrollRuns, eq(payrollRuns.id, payrollItems.payrollRunId))
        .innerJoin(payrollPeriods, eq(payrollPeriods.id, payrollRuns.payrollPeriodId))
        .innerJoin(employees, eq(employees.id, payrollItems.employeeId))
        .where(
          and(
            eq(payrollItems.organizationId, orgId),
            gte(payrollPeriods.periodStart, startDate),
            lte(payrollPeriods.periodEnd, endDate),
            filterEmp
          )
        );

      data = payroll.map((pr) => ({
        "Employee": pr.employeeName,
        "Employee Code": pr.employeeCode,
        "Period": pr.periodName,
        "Basic Salary": pr.basicSalary,
        "Present Days": pr.presentDays,
        "Absent Days": pr.absentDays,
        "Overtime": pr.overtimeAmount,
        "Allowances": pr.allowanceAmount,
        "Deductions": pr.deductionAmount,
        "Gross Pay": pr.grossPay,
        "Net Pay": pr.netPay,
      }));
      filename = `payroll-${startDate}-to-${endDate}`;

    } else {
      return createApiResponse({ success: false, message: "Invalid domain", status: 400 });
    }

    const content = convertToCSV(data);
    
    return new NextResponse(content, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}.csv"`,
      },
    });

  } catch (error) {
    console.error("Error exporting report:", error);
    return createApiResponse({
      success: false,
      message: "Failed to export report",
      status: 500,
    });
  }
}
