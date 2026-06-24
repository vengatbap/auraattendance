import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { systemSettings } from "@/db/schema";
import { z } from "zod";
import { eq } from "drizzle-orm";

const settingsSchema = z.object({
  companyName: z.string().optional(),
  workingHoursStart: z.string().optional(),
  workingHoursEnd: z.string().optional(),
  timezone: z.string().optional(),
  gpsRadius: z.number().optional(),
  theme: z.enum(["light", "dark"]).optional(),
});

export async function GET() {
  try {
    const rows = await db.select().from(systemSettings);
    const settings = rows.reduce((acc, item) => ({
      ...acc,
      [item.key]: item.value,
    }), {} as Record<string, unknown>);
    return NextResponse.json(settings);
  } catch (error) {
    console.error("Get settings error:", error);
    return NextResponse.json({ error: "Failed to fetch settings" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const data = await req.json();
    const result = settingsSchema.safeParse(data);
    if (!result.success) {
      return NextResponse.json({ error: result.error.issues }, { status: 400 });
    }

    const keys = Object.keys(result.data) as Array<keyof typeof result.data>;
    await Promise.all(
      keys.map((key) => {
        const value = result.data[key];
        return db
          .insert(systemSettings)
          .values({ key: String(key), value: value ?? null })
          .onConflictDoUpdate({ target: systemSettings.key, set: { value: value ?? null } });
      })
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Save settings error:", error);
    return NextResponse.json({ error: "Failed to save settings" }, { status: 500 });
  }
}
