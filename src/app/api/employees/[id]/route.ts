import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { employeeService } from "@/modules/employees/service/employee.service";
import { logger } from "@/lib/logger";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  return logger.track(`GET /api/employees/${id}`, async () => {
    try {
      const session = await getSession();
      if (!session || !session.organizationId) {
        return NextResponse.json(
          { success: false, message: "Unauthorized", data: null, meta: null, errors: { global: ["Authentication required"] } },
          { status: 401 }
        );
      }

      const employee = await employeeService.getById(id, session.organizationId);

      return NextResponse.json({
        success: true,
        message: "Employee retrieved successfully",
        data: employee,
        meta: null,
        errors: null,
      });
    } catch (err: unknown) {
      const error = err as Error;
      logger.error(`Failed to get employee ${id}`, error);
      return NextResponse.json(
        {
          success: false,
          message: error.message || "Failed to retrieve employee",
          data: null,
          meta: null,
          errors: { global: [error.message] },
        },
        { status: 404 }
      );
    }
  });
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  return logger.track(`PUT /api/employees/${id}`, async () => {
    try {
      const session = await getSession();
      if (!session || !session.organizationId) {
        return NextResponse.json(
          { success: false, message: "Unauthorized", data: null, meta: null, errors: { global: ["Authentication required"] } },
          { status: 401 }
        );
      }

      const body = await req.json();
      const updated = await employeeService.update(id, session.organizationId, body, session.userId);

      return NextResponse.json({
        success: true,
        message: "Employee updated successfully",
        data: updated,
        meta: null,
        errors: null,
      });
    } catch (err: unknown) {
      const error = err as Error;
      logger.error(`Failed to update employee ${id}`, error);
      return NextResponse.json(
        {
          success: false,
          message: error.message || "Failed to update employee",
          data: null,
          meta: null,
          errors: { global: [error.message] },
        },
        { status: 400 }
      );
    }
  });
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  return logger.track(`DELETE /api/employees/${id}`, async () => {
    try {
      const session = await getSession();
      if (!session || !session.organizationId) {
        return NextResponse.json(
          { success: false, message: "Unauthorized", data: null, meta: null, errors: { global: ["Authentication required"] } },
          { status: 401 }
        );
      }

      await employeeService.delete(id, session.organizationId, session.userId);

      return NextResponse.json({
        success: true,
        message: "Employee deleted successfully",
        data: null,
        meta: null,
        errors: null,
      });
    } catch (err: unknown) {
      const error = err as Error;
      logger.error(`Failed to delete employee ${id}`, error);
      return NextResponse.json(
        {
          success: false,
          message: error.message || "Failed to delete employee",
          data: null,
          meta: null,
          errors: { global: [error.message] },
        },
        { status: 400 }
      );
    }
  });
}
