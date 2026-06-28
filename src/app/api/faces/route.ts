import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { employeeService } from "@/services/employee.service";

const createSchema = z.object({
  employeeCode: z.string().min(1),
  governmentId: z.string().min(1),
  name: z.string().min(2),
  department: z.string().optional(),
  designation: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email().optional(),
  status: z.enum(["active", "inactive", "resigned"]).default("active"),
  enrollmentPhoto: z.string().optional(),
});

export async function GET() {
  return NextResponse.json({ error: "Not implemented" }, { status: 501 });
}

export async function POST(req: NextRequest) {
  try {
    const data = await req.json();
    const result = createSchema.safeParse(data);
    if (!result.success) {
      return NextResponse.json({ error: result.error.issues }, { status: 400 });
    }

    const employee = await employeeService.create(result.data);
    return NextResponse.json(employee, { status: 201 });
  } catch (error) {
    console.error("Create employee error:", error);
    return NextResponse.json({ error: error instanceof Error ? error.message : "Failed to create employee" }, { status: 500 });
  }
}
