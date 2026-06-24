import { NextRequest, NextResponse } from "next/server";
import { attendanceService } from "@/services/attendance.service";
import { z } from "zod";

const checkInSchema = z.object({
  embedding: z.array(z.number()).min(1),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  deviceInfo: z.string().optional(),
  browser: z.string().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const data = await req.json();
    const result = checkInSchema.safeParse(data);
    if (!result.success) {
      return NextResponse.json({ error: result.error.issues }, { status: 400 });
    }

    const response = await attendanceService.recognize({
      ...result.data,
      type: "checkin",
    });

    return NextResponse.json(response);
  } catch (error) {
    console.error("Check-in error:", error);
    return NextResponse.json({ error: "Failed to process check-in" }, { status: 500 });
  }
}
