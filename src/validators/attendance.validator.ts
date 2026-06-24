import { z } from "zod";
import { ATTENDANCE_ADJUSTMENT_TYPES } from "@/constants";

export const attendancePunchSchema = z.object({
  siteId: z.string().uuid().optional(),
  descriptor: z.array(z.number()).min(1),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  photo: z.string().optional(),
  deviceInfo: z.string().optional(),
  browser: z.string().optional(),
});

export const attendanceAdjustmentSchema = z.object({
  attendanceLogId: z.string().uuid(),
  type: z.enum(ATTENDANCE_ADJUSTMENT_TYPES),
  checkInTime: z.string().datetime().optional(),
  checkOutTime: z.string().datetime().optional(),
  date: z.string().date().optional(),
  reason: z.string().min(1, "Reason is required"),
});

export type AttendancePunchInput = z.infer<typeof attendancePunchSchema>;
export type AttendanceAdjustmentInput = z.infer<typeof attendanceAdjustmentSchema>;
