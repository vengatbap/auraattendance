import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({ error: "Reports endpoint is under active development" }, { status: 501 });
}
