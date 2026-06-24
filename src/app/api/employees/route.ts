import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { db } from "@/db";
import { employees } from "@/db/schema";
import { and, eq, or } from "drizzle-orm";
import { z } from "zod";

const CreateEmployeeSchema = z.object({
  employeeNumber: z.string().min(1),
  cpr: z.string().min(1),
  name: z.string().min(2),
  siteId: z.string().uuid().optional().nullable(),
  department: z.string().optional(),
  designation: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email().optional(),
  status: z.enum(["active", "inactive", "resigned"]).default("active"),
  enrollmentPhoto: z.string().optional(),
});

export async function GET() {
  try {
    const session = await getSession();
    if (!session || !session.organizationId) {
      return NextResponse.json({ error: "Unauthorized or Missing Tenant" }, { status: 401 });
    }

    const allEmployees = await db.select().from(employees).where(eq(employees.organizationId, session.organizationId));
    return NextResponse.json(allEmployees);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch employees" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const result = CreateEmployeeSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json({ error: result.error.issues }, { status: 400 });
    }

    const { employeeNumber, cpr, name, siteId, department, designation, phone, email, status, enrollmentPhoto } = result.data;

    const session = await getSession();
    if (!session || !session.organizationId) {
      return NextResponse.json({ error: "Unauthorized or Missing Tenant" }, { status: 401 });
    }

    // Check if employee already exists by employeeNumber, cpr or email
    const conditions = [
      and(eq(employees.employeeNumber, employeeNumber), eq(employees.organizationId, session.organizationId)),
      and(eq(employees.cpr, cpr), eq(employees.organizationId, session.organizationId))
    ];
    if (email) conditions.push(and(eq(employees.email, email), eq(employees.organizationId, session.organizationId)));

    const existing = await db.select().from(employees).where(or(...conditions)).limit(1);
    if (existing.length) {
      return NextResponse.json({ error: "Employee number, Government ID, or email already exists in this tenant" }, { status: 409 });
    }

    const newEmployee = await db
      .insert(employees)
      .values({
        organizationId: session.organizationId,
        employeeNumber,
        cpr,
        name,
        siteId,
        department,
        designation,
        phone,
        email,
        status,
        enrollmentPhoto,
      })
      .returning();

    return NextResponse.json(newEmployee[0], { status: 201 });
  } catch (error) {
    console.error("Error creating employee:", error);
    return NextResponse.json({ error: "Failed to create employee" }, { status: 500 });
  }
}
