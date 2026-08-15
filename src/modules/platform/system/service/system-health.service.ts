import { SystemRepository } from "../repository/system.repository";
import { db } from "@/db";
import { organizations, users, attendanceLogs, sessions } from "@/db/schema";
import { eq, sql, gte } from "drizzle-orm";

export interface SystemHealthReport {
  status: "healthy" | "degraded" | "unhealthy";
  database: {
    connected: boolean;
    size: string;
    activeConnections: number;
  };
  environment: {
    nodeEnv: string;
    timezone: string;
  };
  system: {
    version: string;
    uptime: number;
  };
}

export class SystemHealthService {
  static async getHealthReport(): Promise<SystemHealthReport> {
    const dbConnected = await SystemRepository.checkDatabaseConnection();
    const dbSize = dbConnected ? await SystemRepository.getDatabaseSize() : "N/A";
    const activeConns = dbConnected ? await SystemRepository.getActiveConnections() : 0;

    const report: SystemHealthReport = {
      status: dbConnected ? "healthy" : "unhealthy",
      database: {
        connected: dbConnected,
        size: dbSize,
        activeConnections: activeConns,
      },
      environment: {
        nodeEnv: process.env.NODE_ENV || "development",
        timezone: process.env.TZ || Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC",
      },
      system: {
        version: "1.0.0",
        uptime: process.uptime(),
      },
    };

    return report;
  }

  static async getDashboardSystemStats() {
    // Queries counts from tables
    const [orgCountResult] = await db.select({ count: sql<number>`count(*)` }).from(organizations);
    const [userCountResult] = await db.select({ count: sql<number>`count(*)` }).from(users);
    const [punchCountResult] = await db.select({ count: sql<number>`count(*)` }).from(attendanceLogs);
    
    // Get trials count, suspended count, active users count
    const [suspendedCountResult] = await db.select({ count: sql<number>`count(*)` }).from(organizations).where(eq(organizations.status, "suspended"));
    const [trialCountResult] = await db.select({ count: sql<number>`count(*)` }).from(organizations).where(eq(organizations.subscriptionPlan, "trial"));

    // Active sessions count (not expired)
    const [activeSessionCountResult] = await db
      .select({ count: sql<number>`count(distinct ${sessions.userId})` })
      .from(sessions)
      .where(gte(sessions.expiresAt, new Date()));

    // Recent signups (last 5 organizations)
    const recentOrgs = await db
      .select({
        id: organizations.id,
        name: organizations.name,
        slug: organizations.slug,
        subscriptionPlan: organizations.subscriptionPlan,
        createdAt: organizations.createdAt,
      })
      .from(organizations)
      .orderBy(sql`${organizations.createdAt} DESC`)
      .limit(5);

    return {
      orgCount: Number(orgCountResult?.count || 0),
      userCount: Number(userCountResult?.count || 0),
      punchCount: Number(punchCountResult?.count || 0),
      suspendedCount: Number(suspendedCountResult?.count || 0),
      trialCount: Number(trialCountResult?.count || 0),
      activeSessions: Number(activeSessionCountResult?.count || 0),
      recentOrganizations: recentOrgs,
    };
  }
}
