import { NextRequest, NextResponse } from "next/server";
import { attendancePunchSchema } from "@/modules/attendance/validator/attendance.validator";
import { attendanceService } from "@/modules/attendance/service/attendance.service";
import { logger } from "@/lib/logger";

export async function POST(req: NextRequest) {
  return logger.track("POST /api/attendance/punch", async () => {
    try {
      const body = await req.json();
      const parsed = attendancePunchSchema.safeParse(body);
      if (!parsed.success) {
        return NextResponse.json(
          {
            success: false,
            message: "Validation failed",
            errors: parsed.error.format(),
          },
          { status: 400 }
        );
      }

      const ipAddress =
        req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
        req.headers.get("x-real-ip") ??
        null;

      const result = await attendanceService.punch(parsed.data, ipAddress);

      return NextResponse.json({
        success: true,
        message: "Attendance recorded successfully",
        data: result,
      });
    } catch (err: unknown) {
      const error = err as Error;
      logger.error("Punch request failed", error);
      return NextResponse.json(
        {
          success: false,
          message: error.message || "Failed to process punch request",
          data: null,
        },
        { status: 500 }
      );
    }
  });
}
