import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { departmentService } from "@/modules/departments/service/department.service";
import { logger } from "@/lib/logger";

export async function GET() {
  return logger.track("GET /api/departments", async () => {
    try {
      const session = await getSession();
      if (!session || !session.organizationId) {
        return NextResponse.json(
          { success: false, message: "Unauthorized", data: null, meta: null, errors: { global: ["Authentication required"] } },
          { status: 401 }
        );
      }

      const list = await departmentService.list(session.organizationId);
      return NextResponse.json({
        success: true,
        message: "Departments retrieved successfully",
        data: list,
        meta: null,
        errors: null,
      });
    } catch (err: unknown) {
      const error = err as Error;
      logger.error("Failed to list departments", error);
      return NextResponse.json(
        {
          success: false,
          message: error.message || "Failed to retrieve departments",
          data: null,
          meta: null,
          errors: { global: ["Failed to list departments"] },
        },
        { status: 500 }
      );
    }
  });
}

export async function POST(req: Request) {
  return logger.track("POST /api/departments", async () => {
    try {
      const session = await getSession();
      if (!session || !session.organizationId) {
        return NextResponse.json(
          { success: false, message: "Unauthorized", data: null, meta: null, errors: { global: ["Authentication required"] } },
          { status: 401 }
        );
      }

      const body = await req.json();
      const newDept = await departmentService.create(session.organizationId, body, session.userId);

      return NextResponse.json({
        success: true,
        message: "Department created successfully",
        data: newDept,
        meta: null,
        errors: null,
      });
    } catch (err: unknown) {
      const error = err as Error;
      logger.error("Failed to create department", error);
      return NextResponse.json(
        {
          success: false,
          message: error.message || "Failed to create department",
          data: null,
          meta: null,
          errors: { global: [error.message] },
        },
        { status: 400 }
      );
    }
  });
}
