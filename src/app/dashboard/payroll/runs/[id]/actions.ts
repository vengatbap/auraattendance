"use server";

import { getSession } from "@/lib/auth";
import { PermissionService } from "@/modules/permissions/service/permission.service";
import { PayrollService } from "@/modules/payroll/services/payroll.service";
import { revalidatePath } from "next/cache";

export async function calculateRunAction(runId: string) {
  const session = await getSession();
  if (!session || PermissionService.cannot(session, "payroll.calculate")) {
    throw new Error("Unauthorized");
  }

  await PayrollService.calculateRun(session.organizationId!, runId, session.userId);
  revalidatePath(`/dashboard/payroll/runs/${runId}`);
}

export async function approveRunAction(runId: string) {
  const session = await getSession();
  if (!session || PermissionService.cannot(session, "payroll.approve")) {
    throw new Error("Unauthorized");
  }

  await PayrollService.approveRun(session.organizationId!, runId, session.userId);
  revalidatePath(`/dashboard/payroll/runs/${runId}`);
}

export async function lockRunAction(runId: string) {
  const session = await getSession();
  if (!session || PermissionService.cannot(session, "payroll.lock")) {
    throw new Error("Unauthorized");
  }

  // Invisibly transition through PAID to satisfy the engine
  await PayrollService.payRun(session.organizationId!, runId, session.userId);
  await PayrollService.lockRun(session.organizationId!, runId, session.userId);

  revalidatePath(`/dashboard/payroll/runs/${runId}`);
}
