import { NextRequest, NextResponse } from "next/server";
import { employeeService } from "@/services/employee.service";
import { z } from "zod";

const recognizeSchema = z.object({
  embedding: z.array(z.number()).min(1),
});

export async function POST(req: NextRequest) {
  try {
    const data = await req.json();
    const result = recognizeSchema.safeParse(data);
    if (!result.success) {
      return NextResponse.json({ error: result.error.issues }, { status: 400 });
    }

    const recognition = await employeeService.recognizeFace(result.data.embedding);
    if (!recognition) {
      return NextResponse.json({ matched: false });
    }
    return NextResponse.json({ matched: true, employee: recognition.employee, score: recognition.score });
  } catch (error) {
    console.error("Recognition error:", error);
    return NextResponse.json({ error: "Failed to recognize face" }, { status: 500 });
  }
}
