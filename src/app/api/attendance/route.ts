import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { attendanceLogs, employees, sites } from "@/db/schema";
import { and, desc, eq, ilike, or } from "drizzle-orm";

export async function GET(req: NextRequest) {
  try {
    const limit = parseInt(req.nextUrl.searchParams.get("limit") || "100");
    const offset = parseInt(req.nextUrl.searchParams.get("offset") || "0");
    const date = req.nextUrl.searchParams.get("date");
    const siteId = req.nextUrl.searchParams.get("siteId");
    const search = req.nextUrl.searchParams.get("search");

    const conditions = [];
    if (date) conditions.push(eq(attendanceLogs.date, date));
    if (siteId) conditions.push(eq(attendanceLogs.siteId, siteId));
    if (search) {
      conditions.push(
        or(
          ilike(employees.name, `%${search}%`),
          ilike(employees.employeeNumber, `%${search}%`),
          ilike(employees.cpr, `%${search}%`),
          ilike(sites.name, `%${search}%`)
        )
      );
    }

    const logs = await db
      .select({ log: attendanceLogs, employee: employees, site: sites })
      .from(attendanceLogs)
      .leftJoin(employees, eq(attendanceLogs.employeeId, employees.id))
      .leftJoin(sites, eq(attendanceLogs.siteId, sites.id))
      .where(conditions.length ? and(...conditions) : undefined)
      .orderBy(desc(attendanceLogs.createdAt))
      .limit(limit)
      .offset(offset);

    return NextResponse.json(logs);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch attendance logs" }, { status: 500 });
  }
}
