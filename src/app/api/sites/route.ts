import { db } from "@/db";
import { sites } from "@/db/schema";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { NextResponse } from "next/server";

const siteSchema = z.object({
  name: z.string().min(1),
  latitude: z.number(),
  longitude: z.number(),
  radius: z.number().positive().default(50),
});

export async function GET() {
  const allSites = await db.select().from(sites);
  return NextResponse.json(allSites);
}

export async function POST(req: Request) {
  try {
    const data = await req.json();
    const parsed = siteSchema.parse(data);
    const [newSite] = await db.insert(sites).values(parsed).returning();
    return NextResponse.json(newSite, { status: 201 });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Invalid data" }, { status: 400 });
  }
}
