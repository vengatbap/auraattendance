import { db } from "@/db";
import { attendanceCredentials } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import * as bcrypt from "bcrypt";

export type AuthenticationMethod = "FACE" | "PIN" | "FINGERPRINT" | "SUPERVISOR";
export type AuthenticationResult = "VERIFIED" | "FAILED";

export interface AuthenticationAttempt {
  method: AuthenticationMethod;
  payload: any;
  employeeId?: string;
}

export interface AuthenticationOutcome {
  success: boolean;
  method: AuthenticationMethod;
  employeeId?: string;
  reason?: string;
}

export class AuthenticationService {
  static async authenticate(orgId: string, attempt: AuthenticationAttempt): Promise<AuthenticationOutcome> {
    switch (attempt.method) {
      case "FACE":
        return this.authenticateFace(orgId, attempt);
      case "PIN":
        return this.authenticatePin(orgId, attempt);
      case "SUPERVISOR":
        return this.authenticateSupervisor(orgId, attempt);
      case "FINGERPRINT":
        throw new Error("Fingerprint authentication is not yet implemented.");
      default:
        throw new Error("Unknown authentication method");
    }
  }

  private static async authenticateFace(orgId: string, attempt: AuthenticationAttempt): Promise<AuthenticationOutcome> {
    // In V1, Face authentication is usually done on the client/kiosk (matching against FaceProfile).
    // The server just receives the confidence score. 
    // Here we validate the payload has the required confidence.
    const { employeeId, faceMatchPassed } = attempt.payload;
    
    if (faceMatchPassed) {
      return { success: true, method: "FACE", employeeId };
    }
    return { success: false, method: "FACE", reason: "Face verification failed on client" };
  }

  private static async authenticatePin(orgId: string, attempt: AuthenticationAttempt): Promise<AuthenticationOutcome> {
    const { employeeId, pin } = attempt.payload;
    if (!employeeId || !pin) {
      return { success: false, method: "PIN", reason: "Missing employee code or PIN" };
    }

    const [credential] = await db.select().from(attendanceCredentials).where(and(eq(attendanceCredentials.organizationId, orgId), eq(attendanceCredentials.employeeId, employeeId)));

    if (!credential) {
      return { success: false, method: "PIN", reason: "No PIN credential found for employee" };
    }

    if (!credential.enabled) {
      return { success: false, method: "PIN", reason: "PIN credential is disabled" };
    }

    if (credential.lockedUntil && new Date() < credential.lockedUntil) {
      return { success: false, method: "PIN", reason: "Account is temporarily locked due to too many failed attempts" };
    }

    const isMatch = await bcrypt.compare(pin, credential.pinHash || "");

    if (isMatch) {
      await db.update(attendanceCredentials)
        .set({ failedAttempts: 0, lastUsedAt: new Date(), lockedUntil: null })
        .where(eq(attendanceCredentials.id, credential.id));
        
      return { success: true, method: "PIN", employeeId };
    } else {
      const newAttempts = credential.failedAttempts + 1;
      let lockedUntil = null;
      if (newAttempts >= 5) {
        lockedUntil = new Date(Date.now() + 15 * 60000); // lock for 15 minutes
      }
      
      await db.update(attendanceCredentials)
        .set({ failedAttempts: newAttempts, lockedUntil })
        .where(eq(attendanceCredentials.id, credential.id));
        
      return { success: false, method: "PIN", reason: "Invalid PIN" };
    }
  }

  private static async authenticateSupervisor(orgId: string, attempt: AuthenticationAttempt): Promise<AuthenticationOutcome> {
    // Supervisor override is trusted if invoked by an authorized admin/supervisor.
    return { success: true, method: "SUPERVISOR", employeeId: attempt.employeeId };
  }
}
