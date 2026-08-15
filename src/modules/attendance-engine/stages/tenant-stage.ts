import { PunchStage } from "../engine/pipeline";
import { PunchContext } from "../engine/context";
import { AttendanceEngineRepository } from "../repository/attendance-engine.repository";
import { NotFoundError } from "@/lib/errors";

export class TenantStage implements PunchStage {
  async execute(context: PunchContext): Promise<void> {
    const org = await AttendanceEngineRepository.findOrganizationById(context.trusted.organizationId);
    if (!org) {
      throw new NotFoundError("Organization not found or invalid context");
    }

    context.organization = org;

    // Validate active status
    if (org.status === "suspended") {
      context.outcome = "REJECTED";
      context.resolvedPunchType = undefined;
      context.flags.push("REJECTED_TENANT"); // Track tenant status rejection
      context.warnings.push("Organization is suspended");
      return;
    }

    // Validate trial expiration
    if (org.subscriptionPlan === "trial" && org.trialEndsAt) {
      const trialEnds = new Date(org.trialEndsAt);
      if (context.trusted.receivedAt > trialEnds) {
        context.outcome = "REJECTED";
        context.resolvedPunchType = undefined;
        context.flags.push("REJECTED_TENANT");
        context.warnings.push("Organization trial has expired");
      }
    }
  }
}
