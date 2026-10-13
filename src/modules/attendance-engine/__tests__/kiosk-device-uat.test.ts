import { describe, it, expect, beforeAll } from "vitest";
import { AuthenticationService } from "../authentication/authentication.service";
import { AttendanceEngine } from "../engine/attendance-engine";
import { db } from "@/db";
import { organizations, employees, sites, attendanceCredentials } from "@/db/schema";
import bcrypt from "bcryptjs";
import { eq, and } from "drizzle-orm";
import { PunchInput, TrustedAttendanceContext } from "../types";

describe("📱 Step 2: Kiosk & Device UAT Matrix", () => {
  let orgId: string;
  let siteId: string;
  let employeeId: string;
  const employeeCode = `TEST-KIOSK-${Date.now()}`;
  const correctPin = "4821";

  const getTrustedContext = (isOffline = false): TrustedAttendanceContext => ({
    organizationId: orgId,
    allowedSiteId: siteId,
    requestId: `req-${Date.now()}-${Math.random()}`,
    ipAddress: "192.168.1.100",
    receivedAt: new Date(),
  });

  beforeAll(async () => {
    // 1. Create Test Org with Kiosk settings and feature flags enabled
    const [org] = await db
      .insert(organizations)
      .values({
        name: `Kiosk Test Org ${Date.now()}`,
        slug: `kiosk-test-${Date.now()}`,
        subscriptionPlan: "enterprise",
        status: "active",
        attendanceFaceEnabled: true,
        attendancePinFallbackEnabled: true,
        featureFlags: {
          face: true,
          gps: true,
          qr: false,
          offline: true,
          adjustments: true,
          reports: true,
          analytics: true,
        },
      })
      .returning();
    orgId = org.id;

    // 2. Create Geofenced Site (Tubli)
    const [site] = await db
      .insert(sites)
      .values({
        organizationId: orgId,
        name: "Test Pumping Station",
        latitude: 26.2089,
        longitude: 50.5577,
        radius: 200,
        status: "active",
      })
      .returning();
    siteId = site.id;

    // 3. Create Employee
    const [emp] = await db
      .insert(employees)
      .values({
        organizationId: orgId,
        siteId: siteId,
        employeeCode: employeeCode,
        governmentId: `CPR-KIOSK-${Date.now()}`,
        name: "Test Kiosk Worker",
        status: "active",
        isActive: true,
      })
      .returning();
    employeeId = emp.id;

    // 4. Enroll PIN (4821)
    const pinHash = await bcrypt.hash(correctPin, 10);
    await db.insert(attendanceCredentials).values({
      organizationId: orgId,
      employeeId: employeeId,
      pinHash,
      failedAttempts: 0,
      enabled: true,
    });
  });

  describe("1. PIN Fallback Authentication & Security Rules", () => {
    it("Correct Employee ID + PIN succeeds", async () => {
      const result = await AuthenticationService.authenticate(orgId, {
        method: "PIN",
        employeeId: employeeId,
        payload: { employeeId, pin: correctPin },
      });
      expect(result.success).toBe(true);
      expect(result.employeeId).toBe(employeeId);
    });

    it("Correct Employee ID + Wrong PIN fails and increments failed attempts", async () => {
      const result = await AuthenticationService.authenticate(orgId, {
        method: "PIN",
        employeeId: employeeId,
        payload: { employeeId, pin: "9999" },
      });
      expect(result.success).toBe(false);
      expect(result.reason).toContain("Invalid PIN");

      const cred = await db.query.attendanceCredentials.findFirst({
        where: and(eq(attendanceCredentials.organizationId, orgId), eq(attendanceCredentials.employeeId, employeeId)),
      });
      expect(cred?.failedAttempts).toBeGreaterThanOrEqual(1);
    });

    it("Non-existent Employee is cleanly rejected", async () => {
      const fakeId = "00000000-0000-0000-0000-000000000000";
      const result = await AuthenticationService.authenticate(orgId, {
        method: "PIN",
        employeeId: fakeId,
        payload: { employeeId: fakeId, pin: correctPin },
      });
      expect(result.success).toBe(false);
    });

    it("5 consecutive failed PIN attempts trigger temporary lockout", async () => {
      for (let i = 0; i < 5; i++) {
        await AuthenticationService.authenticate(orgId, {
          method: "PIN",
          employeeId: employeeId,
          payload: { employeeId, pin: "0000" },
        });
      }

      const lockoutResult = await AuthenticationService.authenticate(orgId, {
        method: "PIN",
        employeeId: employeeId,
        payload: { employeeId, pin: correctPin },
      });
      expect(lockoutResult.success).toBe(false);
      expect(lockoutResult.reason).toContain("locked");
    }, 60000);
  });

  describe("2. Offline Security Boundary", () => {
    it("Offline punches strictly PROHIBIT PIN authentication (Online only)", async () => {
      const [freshEmp] = await db
        .insert(employees)
        .values({
          organizationId: orgId,
          siteId: siteId,
          employeeCode: `PIN-OFF-${Date.now()}`,
          governmentId: `CPR-OFF-${Date.now()}`,
          name: "Offline PIN Tester",
          status: "active",
          isActive: true,
        })
        .returning();

      const pinHash = await bcrypt.hash(correctPin, 10);
      await db.insert(attendanceCredentials).values({
        organizationId: orgId,
        employeeId: freshEmp.id,
        pinHash,
        failedAttempts: 0,
        enabled: true,
      });

      const punchInput: PunchInput = {
        clientEventId: `offline-pin-${Date.now()}`,
        employeeId: freshEmp.id,
        authMethod: "PIN",
        pin: correctPin,
        capturedAt: new Date().toISOString(),
        isOffline: true,
      };

      const result = await AttendanceEngine.processPunch(punchInput, getTrustedContext(true));

      expect(result.success).toBe(false);
      expect(result.flags).toContain("OFFLINE_PIN_PROHIBITED");
    });
  });

  describe("3. Geofence & Punch Verification", () => {
    it("Punches inside site perimeter (<= 200m) pass geofence without outside flag", async () => {
      const [empGeo] = await db
        .insert(employees)
        .values({
          organizationId: orgId,
          siteId: siteId,
          employeeCode: `GEO-IN-${Date.now()}`,
          governmentId: `CPR-GEO1-${Date.now()}`,
          name: "Geofence Inside Tester",
          status: "active",
          isActive: true,
        })
        .returning();

      const pinHash = await bcrypt.hash(correctPin, 10);
      await db.insert(attendanceCredentials).values({
        organizationId: orgId,
        employeeId: empGeo.id,
        pinHash,
        failedAttempts: 0,
        enabled: true,
      });

      const punchInput: PunchInput = {
        clientEventId: `geofence-in-${Date.now()}`,
        employeeId: empGeo.id,
        authMethod: "PIN",
        pin: correctPin,
        latitude: 26.2089,
        longitude: 50.5577,
        capturedAt: new Date().toISOString(),
      };

      const result = await AttendanceEngine.processPunch(punchInput, getTrustedContext(false));
      expect(result.flags).not.toContain("OUTSIDE_GEOFENCE");
    }, 60000);

    it("Punches outside site perimeter (> 200m) are flagged with OUTSIDE_GEOFENCE", async () => {
      const [empGeoOut] = await db
        .insert(employees)
        .values({
          organizationId: orgId,
          siteId: siteId,
          employeeCode: `GEO-OUT-${Date.now()}`,
          governmentId: `CPR-GEO2-${Date.now()}`,
          name: "Geofence Outside Tester",
          status: "active",
          isActive: true,
        })
        .returning();

      const pinHash = await bcrypt.hash(correctPin, 10);
      await db.insert(attendanceCredentials).values({
        organizationId: orgId,
        employeeId: empGeoOut.id,
        pinHash,
        failedAttempts: 0,
        enabled: true,
      });

      const punchInput: PunchInput = {
        clientEventId: `geofence-out-${Date.now()}`,
        employeeId: empGeoOut.id,
        authMethod: "PIN",
        pin: correctPin,
        latitude: 26.3500,
        longitude: 50.8000, // ~30km away
        capturedAt: new Date().toISOString(),
      };

      const result = await AttendanceEngine.processPunch(punchInput, getTrustedContext(false));
      expect(result.flags).toContain("OUTSIDE_GEOFENCE");
    }, 60000);
  });

  describe("4. Idempotency & Rapid Repeated Punch Suppression", () => {
    it("Exact duplicate clientEventId returns the cached result without duplicate entry", async () => {
      const [empIdem] = await db
        .insert(employees)
        .values({
          organizationId: orgId,
          siteId: siteId,
          employeeCode: `IDEM-${Date.now()}`,
          governmentId: `CPR-IDEM-${Date.now()}`,
          name: "Idempotency Tester",
          status: "active",
          isActive: true,
        })
        .returning();

      const pinHash = await bcrypt.hash(correctPin, 10);
      await db.insert(attendanceCredentials).values({
        organizationId: orgId,
        employeeId: empIdem.id,
        pinHash,
        failedAttempts: 0,
        enabled: true,
      });

      const key = `idem-${Date.now()}`;
      const punchInput: PunchInput = {
        clientEventId: key,
        employeeId: empIdem.id,
        authMethod: "PIN",
        pin: correctPin,
        latitude: 26.2089,
        longitude: 50.5577,
        capturedAt: new Date().toISOString(),
      };

      const first = await AttendanceEngine.processPunch(punchInput, getTrustedContext(false));
      const second = await AttendanceEngine.processPunch(punchInput, getTrustedContext(false));

      expect(second.success).toBe(first.success);
      expect(second.action).toBe(first.action);
    }, 60000);
  });
});
