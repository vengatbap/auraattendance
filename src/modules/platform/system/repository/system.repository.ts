import { db } from "@/db";
import { sql } from "drizzle-orm";

export class SystemRepository {
  static async checkDatabaseConnection(): Promise<boolean> {
    try {
      await db.execute(sql`SELECT 1`);
      return true;
    } catch (err) {
      console.error("Database health check failed:", err);
      return false;
    }
  }

  static async getDatabaseSize(): Promise<string> {
    try {
      const result = await db.execute(
        sql`SELECT pg_size_pretty(pg_database_size(current_database())) as size`
      );
      return (result.rows[0]?.size as string) || "Unknown";
    } catch {
      return "N/A";
    }
  }

  static async getActiveConnections(): Promise<number> {
    try {
      const result = await db.execute(
        sql`SELECT count(*) as count FROM pg_stat_activity`
      );
      return Number(result.rows[0]?.count || 0);
    } catch {
      return 0;
    }
  }
}
