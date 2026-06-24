import { NextResponse } from "next/server";
import { logoutSession } from "@/lib/auth";

export async function POST() {
  await logoutSession();
  return NextResponse.json({ message: "Logged out successfully" });
}
