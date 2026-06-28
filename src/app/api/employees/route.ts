import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { employeeService } from "@/modules/employees/service/employee.service";
import { logger } from "@/lib/logger";

export async function GET() {
  return logger.track("GET /api/employees", async () => {
    try {
      const session = await getSession();
      if (!session || !session.organizationId) {
        return NextResponse.json(
          { success: false, message: "Unauthorized", data: null, meta: null, errors: { global: ["Authentication required"] } },
          { status: 401 }
        );
      }

      const list = await employeeService.list(session.organizationId);

      return NextResponse.json({
        success: true,
        message: "Employees retrieved successfully",
        data: list,
        meta: null,
        errors: null,
      });
    } catch (err: unknown) {
      const error = err as Error;
      logger.error("Failed to list employees", error);
      return NextResponse.json(
        {
          success: false,
          message: error.message || "Failed to retrieve employees",
          data: null,
          meta: null,
          errors: { global: ["Failed to list employees"] },
        },
        { status: 500 }
      );
    }
  });
}

export async function POST(req: NextRequest) {
  return logger.track("POST /api/employees", async () => {
    try {
      const session = await getSession();
      if (!session || !session.organizationId) {
        return NextResponse.json(
          { success: false, message: "Unauthorized", data: null, meta: null, errors: { global: ["Authentication required"] } },
          { status: 401 }
        );
      }

      const body = await req.json();
      const newEmployee = await employeeService.create(session.organizationId, body, session.userId);

      return NextResponse.json({
        success: true,
        message: "Employee created successfully",
        data: newEmployee,
        meta: null,
        errors: null,
      });
    } catch (err: unknown) {
      const error = err as Error;
      logger.error("Failed to create employee", error);
      return NextResponse.json(
        {
          success: false,
          message: error.message || "Failed to create employee",
          data: null,
          meta: null,
          errors: { global: [error.message] },
        },
        { status: 400 }
      );
    }
  });
}
