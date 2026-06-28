import { NextResponse } from "next/server";
import { db } from "@/db";
import { sql } from "drizzle-orm";

export async function GET() {
  try {
    // Quick db ping check
    await db.execute(sql`SELECT 1`);

    return NextResponse.json({
      status: "UP",
      database: "CONNECTED",
      timestamp: new Date().toISOString(),
      uptimeSeconds: Math.round(process.uptime()),
    });
  } catch (error) {
    console.error("Health check error:", error);
    return NextResponse.json(
      {
        status: "DOWN",
        database: "DISCONNECTED",
        error: error instanceof Error ? error.message : "Diagnostics check failed",
      },
      { status: 503 }
    );
  }
}
