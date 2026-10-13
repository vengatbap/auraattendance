import { PunchStage } from "../engine/pipeline";
import { PunchContext } from "../engine/context";
import { AuthenticationService, AuthenticationAttempt } from "../authentication/authentication.service";
import { AttendanceEngineRepository } from "../repository/attendance-engine.repository";
import { FeatureService, FeatureRegistry } from "@/lib/features";
import { AttendanceFlag } from "../types";

export class AuthenticationStage implements PunchStage {
  async execute(context: PunchContext): Promise<void> {
    if (context.outcome === "REJECTED") return;

    const orgId = context.trusted.organizationId;
    const method = context.input.authMethod || "FACE";
    context.authMethod = method;
    context.authResult = "FAILED"; // Default until proven otherwise

    if (method === "FACE") {
      const isFaceEnabled = await FeatureService.isEnabled(orgId, FeatureRegistry.FACE);
      if (!isFaceEnabled && !context.organization?.attendanceFaceEnabled) {
        context.outcome = "REJECTED";
        context.warnings.push("Face authentication is disabled for this organization.");
        return;
      }
      
      // Face payload could be passed directly from client as faceMatchPassed or raw descriptor
      // In Aura V1, the client does the match, we just trust the token or do a distance check if descriptor is passed
      let faceMatchPassed = context.input.faceMatchPassed;
      
      if (context.input.descriptor && !faceMatchPassed) {
         // Fallback legacy Euclidean distance logic
         const profiles = await AttendanceEngineRepository.findEmployeeProfiles(orgId);
         let bestMatch: any = null;
         for (const profile of profiles) {
           const dbEmbedding = profile.embedding as number[];
           if (!dbEmbedding || dbEmbedding.length !== context.input.descriptor.length) continue;
     
           let sum = 0;
           for (let i = 0; i < context.input.descriptor.length; i++) {
             const diff = context.input.descriptor[i] - dbEmbedding[i];
             sum += diff * diff;
           }
           const dist = Math.sqrt(sum);
           if (bestMatch === null || dist < bestMatch.distance) {
             bestMatch = { employeeId: profile.employeeId, distance: dist };
           }
         }
         
         const threshold = context.organization?.faceMatchThreshold ?? 0.6;
         if (bestMatch) {
            context.faceDistance = bestMatch.distance;
            context.faceThreshold = threshold;
            faceMatchPassed = bestMatch.distance <= (1 - threshold);
            if (faceMatchPassed) {
               context.input.employeeId = bestMatch.employeeId;
            }
         }
      }

      const authAttempt: AuthenticationAttempt = {
        method: "FACE",
        payload: { employeeId: context.input.employeeId, faceMatchPassed },
      };

      const result = await AuthenticationService.authenticate(orgId, authAttempt);
      if (result.success) {
        context.authResult = "VERIFIED";
        context.faceMatchPassed = true;
        context.input.employeeId = result.employeeId;
      } else {
        context.flags.push(AttendanceFlag.LOW_CONFIDENCE);
        context.warnings.push(result.reason || "Face match failed.");
      }
    } 
    else if (method === "PIN") {
      if (context.input.isOffline) {
        context.outcome = "REJECTED";
        context.warnings.push("Offline PIN authentication is not supported.");
        return;
      }

      if (!context.organization?.attendancePinFallbackEnabled) {
        context.outcome = "REJECTED";
        context.warnings.push("PIN fallback authentication is disabled for this organization.");
        return;
      }

      if (!context.input.employeeCode || !context.input.pin) {
        context.outcome = "REJECTED";
        context.warnings.push("Missing employee code or PIN.");
        return;
      }

      // We need employeeId to authenticate PIN
      let employeeId = context.input.employeeId;
      if (!employeeId) {
         // Lookup by employeeCode
         const employee = await AttendanceEngineRepository.findEmployeeByCode(orgId, context.input.employeeCode);
         if (!employee) {
            context.outcome = "REJECTED";
            context.warnings.push("Invalid employee code.");
            return;
         }
         employeeId = employee.id;
      }

      const authAttempt: AuthenticationAttempt = {
        method: "PIN",
        payload: { employeeId, pin: context.input.pin },
      };

      const result = await AuthenticationService.authenticate(orgId, authAttempt);
      if (result.success) {
        context.authResult = "VERIFIED";
        context.input.employeeId = result.employeeId;
      } else {
        context.outcome = "REJECTED";
        context.warnings.push(result.reason || "Invalid PIN.");
      }
    }
    else if (method === "SUPERVISOR") {
      const authAttempt: AuthenticationAttempt = {
        method: "SUPERVISOR",
        payload: {},
        employeeId: context.input.employeeId,
      };
      
      const result = await AuthenticationService.authenticate(orgId, authAttempt);
      if (result.success) {
         context.authResult = "VERIFIED";
      } else {
         context.outcome = "REJECTED";
         context.warnings.push("Supervisor override rejected.");
      }
    }
    else {
      context.outcome = "REJECTED";
      context.warnings.push(`Unsupported authentication method: ${method}`);
    }
  }
}
