import { db } from "@/db";
import { attendanceLogs, loginHistory } from "@/db/schema";
import { eq, sql } from "drizzle-orm";

export class OrganizationStatsService {
  /**
   * Calculates the latest activity timestamp for a given organization ID
   * by taking the maximum date between attendance logs and portal user logins.
   */
  static async getLastActivityAt(organizationId: string): Promise<Date | null> {
    const [punchRes] = await db
      .select({ maxVal: sql<Date>`MAX(${attendanceLogs.createdAt})` })
      .from(attendanceLogs)
      .where(eq(attendanceLogs.organizationId, organizationId));

    const [loginRes] = await db
      .select({ maxVal: sql<Date>`MAX(${loginHistory.timestamp})` })
      .from(loginHistory)
      .where(eq(loginHistory.organizationId, organizationId));

    const punchDate = punchRes?.maxVal ? new Date(punchRes.maxVal) : null;
    const loginDate = loginRes?.maxVal ? new Date(loginRes.maxVal) : null;

    if (!punchDate && !loginDate) return null;
    if (!punchDate) return loginDate;
    if (!loginDate) return punchDate;
    return punchDate > loginDate ? punchDate : loginDate;
  }
}
