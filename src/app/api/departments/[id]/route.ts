import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { departmentService } from "@/modules/departments/service/department.service";
import { logger } from "@/lib/logger";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  return logger.track(`GET /api/departments/${id}`, async () => {
    try {
      const session = await getSession();
      if (!session || !session.organizationId) {
        return NextResponse.json(
          { success: false, message: "Unauthorized", data: null, meta: null, errors: { global: ["Authentication required"] } },
          { status: 401 }
        );
      }

      const dept = await departmentService.getById(id, session.organizationId);

      return NextResponse.json({
        success: true,
        message: "Department retrieved successfully",
        data: dept,
        meta: null,
        errors: null,
      });
    } catch (err: unknown) {
      const error = err as Error;
      logger.error(`Failed to get department ${id}`, error);
      return NextResponse.json(
        {
          success: false,
          message: error.message || "Failed to retrieve department",
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
  return logger.track(`PUT /api/departments/${id}`, async () => {
    try {
      const session = await getSession();
      if (!session || !session.organizationId) {
        return NextResponse.json(
          { success: false, message: "Unauthorized", data: null, meta: null, errors: { global: ["Authentication required"] } },
          { status: 401 }
        );
      }

      const body = await req.json();
      const updated = await departmentService.update(id, session.organizationId, body, session.userId);

      return NextResponse.json({
        success: true,
        message: "Department updated successfully",
        data: updated,
        meta: null,
        errors: null,
      });
    } catch (err: unknown) {
      const error = err as Error;
      logger.error(`Failed to update department ${id}`, error);
      return NextResponse.json(
        {
          success: false,
          message: error.message || "Failed to update department",
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
  return logger.track(`DELETE /api/departments/${id}`, async () => {
    try {
      const session = await getSession();
      if (!session || !session.organizationId) {
        return NextResponse.json(
          { success: false, message: "Unauthorized", data: null, meta: null, errors: { global: ["Authentication required"] } },
          { status: 401 }
        );
      }

      await departmentService.delete(id, session.organizationId, session.userId);

      return NextResponse.json({
        success: true,
        message: "Department deleted successfully",
        data: null,
        meta: null,
        errors: null,
      });
    } catch (err: unknown) {
      const error = err as Error;
      logger.error(`Failed to delete department ${id}`, error);
      return NextResponse.json(
        {
          success: false,
          message: error.message || "Failed to delete department",
          data: null,
          meta: null,
          errors: { global: [error.message] },
        },
        { status: 400 }
      );
    }
  });
}
