import { PunchStage } from "../engine/pipeline";
import { PunchContext } from "../engine/context";
import { AttendanceEngineRepository } from "../repository/attendance-engine.repository";
import { FeatureService, FeatureRegistry } from "@/lib/features";
import { AttendanceFlag } from "../types";

export class FaceIdentificationStage implements PunchStage {
  async execute(context: PunchContext): Promise<void> {
    if (context.outcome === "REJECTED") return;

    const orgId = context.trusted.organizationId;
    const isFaceEnabled = await FeatureService.isEnabled(orgId, FeatureRegistry.FACE);
    if (!isFaceEnabled) {
      return; // Skip face identification if feature flag is disabled
    }

    const descriptor = context.input.descriptor;
    if (!descriptor || descriptor.length === 0) {
      // Face is enabled but no biometrics payload provided
      context.faceMatchPassed = false;
      context.flags.push(AttendanceFlag.FACE_NOT_REGISTERED);
      context.warnings.push("Biometric descriptor is missing");
      return;
    }

    // Retrieve face profiles restricted to organizationId
    const profiles = await AttendanceEngineRepository.findEmployeeProfiles(orgId);
    if (profiles.length === 0) {
      context.faceMatchPassed = false;
      context.flags.push(AttendanceFlag.FACE_NOT_REGISTERED);
      context.warnings.push("No face profiles registered for organization");
      return;
    }

    // Find nearest match using Euclidean distance
    let bestMatch: { employeeId: string; distance: number } | null = null;

    for (const profile of profiles) {
      const dbEmbedding = profile.embedding as number[];
      if (!dbEmbedding || dbEmbedding.length !== descriptor.length) continue;

      let sum = 0;
      for (let i = 0; i < descriptor.length; i++) {
        const diff = descriptor[i] - dbEmbedding[i];
        sum += diff * diff;
      }
      const dist = Math.sqrt(sum);

      if (bestMatch === null || dist < bestMatch.distance) {
        bestMatch = { employeeId: profile.employeeId, distance: dist };
      }
    }

    const threshold = context.organization?.faceMatchThreshold ?? 0.6;
    context.faceThreshold = threshold;

    if (bestMatch) {
      context.faceDistance = bestMatch.distance;
      // Drizzle threshold standard validation
      const passed = bestMatch.distance <= (1 - threshold);
      context.faceMatchPassed = passed;

      if (passed) {
        // Assign employee ID to input to resolve in the next stage
        context.input.employeeId = bestMatch.employeeId;
      } else {
        if (context.input.employeeId || context.input.employeeCode) {
          context.flags.push(AttendanceFlag.LOW_CONFIDENCE);
          context.warnings.push(`Face biometric verification low confidence: dist=${bestMatch.distance.toFixed(4)}`);
        } else {
          context.flags.push(AttendanceFlag.FACE_NOT_REGISTERED);
          context.warnings.push(`No matching face found in organization. Best dist=${bestMatch.distance.toFixed(4)}`);
        }
      }
    } else {
      context.faceMatchPassed = false;
      context.flags.push(AttendanceFlag.FACE_NOT_REGISTERED);
    }
  }
}
