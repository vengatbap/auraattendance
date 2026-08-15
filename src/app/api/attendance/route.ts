import { NextRequest } from "next/server";
import { db } from "@/db";
import { attendanceLogs, employees, sites } from "@/db/schema";
import { and, desc, eq, ilike, or, gte, lte } from "drizzle-orm";
import { getSession } from "@/lib/auth";
import { PermissionService } from "@/lib/rbac";
import { createApiResponse } from "@/lib/api-response";

export async function GET(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session || !session.organizationId) {
      return createApiResponse({
        success: false,
        message: "Unauthorized",
        status: 401,
      });
    }

    if (PermissionService.cannot(session, "attendance.read")) {
      return createApiResponse({
        success: false,
        message: "Forbidden: insufficient permissions",
        status: 403,
      });
    }

    const limit = parseInt(req.nextUrl.searchParams.get("limit") || "100");
    const offset = parseInt(req.nextUrl.searchParams.get("offset") || "0");
    const date = req.nextUrl.searchParams.get("date");
    const startDate = req.nextUrl.searchParams.get("startDate");
    const endDate = req.nextUrl.searchParams.get("endDate");
    const siteId = req.nextUrl.searchParams.get("siteId");
    const search = req.nextUrl.searchParams.get("search");

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const conditions: any[] = [eq(attendanceLogs.organizationId, session.organizationId)];
    if (date) conditions.push(eq(attendanceLogs.date, date));
    if (startDate) conditions.push(gte(attendanceLogs.date, startDate));
    if (endDate) conditions.push(lte(attendanceLogs.date, endDate));
    if (siteId) conditions.push(eq(attendanceLogs.siteId, siteId));
    if (search) {
      conditions.push(
        or(
          ilike(employees.name, `%${search}%`),
          ilike(employees.employeeCode, `%${search}%`),
          ilike(employees.governmentId, `%${search}%`),
          ilike(sites.name, `%${search}%`)
        )
      );
    }

    const logs = await db
      .select({ log: attendanceLogs, employee: employees, site: sites })
      .from(attendanceLogs)
      .leftJoin(employees, eq(attendanceLogs.employeeId, employees.id))
      .leftJoin(sites, eq(attendanceLogs.siteId, sites.id))
      .where(and(...conditions))
      .orderBy(desc(attendanceLogs.date), desc(attendanceLogs.createdAt))
      .limit(limit)
      .offset(offset);

    return createApiResponse({
      success: true,
      message: "Attendance logs retrieved successfully",
      data: logs,
    });
  } catch (error) {
    console.error("Failed to fetch attendance logs:", error);
    return createApiResponse({
      success: false,
      message: "Failed to fetch attendance logs",
      status: 500,
    });
  }
}
