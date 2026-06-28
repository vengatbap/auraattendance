import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    name: "AURA Attendance System",
    version: "1.0.0",
    environment: process.env.NODE_ENV || "production",
    releasedAt: "2026-06-28",
    licence: "SaaS V1 Enterprise",
  });
}
