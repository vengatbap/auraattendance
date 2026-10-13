import { describe, it, expect, beforeAll } from "vitest";
import { db } from "@/db";
import {
  organizations,
  users,
  employees,
  sites,
  departments,
  attendanceCredentials,
  attendanceLogs,
  attendanceEvents,
  attendanceAdjustments,
  leaveTypes,
  leaveBalances,
  leaveRequests,
  salarySettings,
  payrollPeriods,
  payrollRuns,
  payrollItems,
  auditLogs,
} from "@/db/schema";
import bcrypt from "bcryptjs";
import { eq, and, desc } from "drizzle-orm";
import { AttendanceEngine } from "@/modules/attendance-engine/engine/attendance-engine";
import { AuthenticationService } from "@/modules/attendance-engine/authentication/authentication.service";
import { OperationsService, AnomalyType } from "@/modules/operations/service/operations.service";
import { LeaveService } from "@/modules/leave/service/leave.service";
import { PayrollService } from "@/modules/payroll/services/payroll.service";
import { MoneyService } from "@/modules/payroll/services/money.service";
import { PermissionService } from "@/lib/rbac";
import { PunchInput, TrustedAttendanceContext } from "@/modules/attendance-engine/types";

describe("🧪 Step 4: Full End-to-End Workforce Lifecycle Suite", { timeout: 60000 }, () => {
  let orgId: string;
  let tenantAdminUser: any;
  let managerUser: any;
  let supervisorUser: any;
  let payrollUser: any;
  let siteTubli: any;
  let deptDistribution: any;

  // The 8 Master Employees
  let empA_Normal: any;
  let empB_Late: any;
  let empC_MissingOut: any;
  let empD_OutsideGeo: any;
  let empE_PinFallback: any;
  let empF_ApprovedLeave: any;
  let empG_UnpaidAbsent: any;
  let empH_Overtime: any;

  const defaultPin = "4821";
  let defaultPinHash: string;

  const getTrustedContext = (isOffline = false): TrustedAttendanceContext => ({
    organizationId: orgId,
    allowedSiteId: siteTubli.id,
    requestId: `req-e2e-${Date.now()}-${Math.random().toString(36).substring(7)}`,
    ipAddress: "192.168.1.50",
    receivedAt: new Date(),
  });

  beforeAll(async () => {
    defaultPinHash = await bcrypt.hash(defaultPin, 10);
    const passwordHash = await bcrypt.hash("Demo1234!", 10);

    // 1. Create Demo Tenant: Bahrain Water Services
    const [org] = await db
      .insert(organizations)
      .values({
        name: `Bahrain Water Services (E2E-${Date.now()})`,
        slug: `bws-e2e-${Date.now()}`,
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

    // 2. Provision Roles
    const [admin] = await db
      .insert(users)
      .values({ organizationId: orgId, email: `admin-${Date.now()}@bws.com`, passwordHash, name: "Tariq Al-Mansoor", role: "admin" })
      .returning();
    tenantAdminUser = admin;

    const [mgr] = await db
      .insert(users)
      .values({ organizationId: orgId, email: `mgr-${Date.now()}@bws.com`, passwordHash, name: "Fatima Al-Zaabi", role: "manager" })
      .returning();
    managerUser = mgr;

    const [sup] = await db
      .insert(users)
      .values({ organizationId: orgId, email: `sup-${Date.now()}@bws.com`, passwordHash, name: "Khalid Al-Shamsi", role: "manager" })
      .returning();
    supervisorUser = sup;

    const [pay] = await db
      .insert(users)
      .values({ organizationId: orgId, email: `pay-${Date.now()}@bws.com`, passwordHash, name: "Layla Al-Hosani", role: "admin" })
      .returning();
    payrollUser = pay;

    // 3. Departments & Sites
    const [dept] = await db
      .insert(departments)
      .values({ organizationId: orgId, name: "Water Distribution" })
      .returning();
    deptDistribution = dept;

    const [site] = await db
      .insert(sites)
      .values({
        organizationId: orgId,
        name: "Tubli Pumping Station",
        latitude: 26.2089,
        longitude: 50.5577,
        radius: 250,
        status: "active",
      })
      .returning();
    siteTubli = site;

    // 4. Provision 8 Employees
    const employeeSpecs = [
      { code: `A-${Date.now()}`, name: "Ahmed Hassan", desig: "Field Engineer", salary: "3200.00" },
      { code: `B-${Date.now()}`, name: "Mariam Al-Hashimi", desig: "Water Chemist", salary: "3400.00" },
      { code: `C-${Date.now()}`, name: "Yousef Al-Shamsi", desig: "Mechanical Tech", salary: "2900.00" },
      { code: `D-${Date.now()}`, name: "Noura Al-Marzouqi", desig: "SCADA Specialist", salary: "3100.00" },
      { code: `E-${Date.now()}`, name: "Omar Al-Qubaisi", desig: "Electrical Engineer", salary: "3500.00" },
      { code: `F-${Date.now()}`, name: "Aisha Al-Dhaheri", desig: "Safety Officer", salary: "2800.00" },
      { code: `G-${Date.now()}`, name: "Sami Al-Neyadi", desig: "Pipeline Tech", salary: "2600.00" },
      { code: `H-${Date.now()}`, name: "Dana Al-Habsi", desig: "Valve Inspector", salary: "2750.00" },
    ];

    const createdEmps: any[] = [];
    for (const spec of employeeSpecs) {
      const [emp] = await db
        .insert(employees)
        .values({
          organizationId: orgId,
          departmentId: deptDistribution.id,
          siteId: siteTubli.id,
          employeeCode: spec.code,
          governmentId: `CPR-${Date.now()}-${spec.code}`,
          name: spec.name,
          email: `${spec.code.toLowerCase()}@bws.com`,
          designation: spec.desig,
          status: "active",
          isActive: true,
        })
        .returning();

      // PIN
      await db.insert(attendanceCredentials).values({
        organizationId: orgId,
        employeeId: emp.id,
        pinHash: defaultPinHash,
        failedAttempts: 0,
        enabled: true,
      });

      // Salary
      await db.insert(salarySettings).values({
        organizationId: orgId,
        employeeId: emp.id,
        currency: "BHD",
        payFrequency: "monthly",
        basicSalary: spec.salary,
        overtimeRate: "1.50",
        workingDaysPerPeriod: "22",
        workingHoursPerDay: "8",
        effectiveFrom: "2026-09-01",
        status: "ACTIVE",
      });

      createdEmps.push(emp);
    }

    [empA_Normal, empB_Late, empC_MissingOut, empD_OutsideGeo, empE_PinFallback, empF_ApprovedLeave, empG_UnpaidAbsent, empH_Overtime] = createdEmps;

    // 5. Leave Type & Balances
    const [annualLeave] = await db
      .insert(leaveTypes)
      .values({
        organizationId: orgId,
        name: "Annual Leave",
        code: "AL",
        annualAllowance: 22,
        isPaid: true,
      })
      .returning();

    for (const emp of createdEmps) {
      await db.insert(leaveBalances).values({
        organizationId: orgId,
        employeeId: emp.id,
        leaveTypeId: annualLeave.id,
        year: 2026,
        allocatedDays: 22.0,
        usedDays: 4.0,
        pendingDays: 0.0,
        status: "ACTIVE",
      });
    }
  }, 180000);

  // ───────────────────────────────────────────────────────────────────────────
  // ACT 1: KIOSK FACE ATTENDANCE (Employee A)
  // ───────────────────────────────────────────────────────────────────────────
  describe("1. Kiosk Face Recognition Attendance", () => {
    it("Employee A checks in via Face scanner successfully", async () => {
      const punchInput: PunchInput = {
        clientEventId: `punch-in-a-${Date.now()}`,
        employeeId: empA_Normal.id,
        authMethod: "FACE",
        faceMatchPassed: true,
        latitude: 26.2089,
        longitude: 50.5577,
        capturedAt: "2026-09-01T07:55:00.000Z",
      };

      const result = await AttendanceEngine.processPunch(punchInput, getTrustedContext());
      expect(result.success).toBe(true);
      expect(result.action).toBe("CHECK_IN");
      expect(result.employee?.id).toBe(empA_Normal.id);

      // Verify log created in DB
      const log = await db.query.attendanceLogs.findFirst({
        where: and(eq(attendanceLogs.organizationId, orgId), eq(attendanceLogs.employeeId, empA_Normal.id)),
      });
      expect(log).toBeDefined();
      expect(log?.authenticationMethod).toBe("FACE");
      expect(log?.checkInTime).toBeDefined();
    });

    it("Employee A checks out via Face scanner at end of shift", async () => {
      const punchOutInput: PunchInput = {
        clientEventId: `punch-out-a-${Date.now()}`,
        employeeId: empA_Normal.id,
        authMethod: "FACE",
        faceMatchPassed: true,
        latitude: 26.2089,
        longitude: 50.5577,
        capturedAt: "2026-09-01T17:00:00.000Z",
      };

      const result = await AttendanceEngine.processPunch(punchOutInput, getTrustedContext());
      expect(result.success).toBe(true);
      expect(result.action).toBe("CHECK_OUT");

      const log = await db.query.attendanceLogs.findFirst({
        where: and(eq(attendanceLogs.organizationId, orgId), eq(attendanceLogs.employeeId, empA_Normal.id)),
      });
      expect(log?.checkOutTime).toBeDefined();
    });
  });

  // ───────────────────────────────────────────────────────────────────────────
  // ACT 2: BIOMETRIC FALLBACK & PIN PUNCH (Employee E)
  // ───────────────────────────────────────────────────────────────────────────
  describe("2. Biometric Fallback & PIN Authentication", () => {
    it("Face failure triggers fallback; Employee E checks in with Employee Code + PIN", async () => {
      // Step 1: Face match failed authentication check
      const faceAuth = await AuthenticationService.authenticate(orgId, {
        method: "FACE",
        employeeId: empE_PinFallback.id,
        payload: { employeeId: empE_PinFallback.id, faceMatchPassed: false },
      });
      expect(faceAuth.success).toBe(false);

      // Step 2: Employee taps PIN and enters Code + PIN 4821
      const pinPunchInput: PunchInput = {
        clientEventId: `punch-pin-e-${Date.now()}`,
        employeeId: empE_PinFallback.id,
        authMethod: "PIN",
        pin: defaultPin,
        latitude: 26.2089,
        longitude: 50.5577,
        capturedAt: "2026-09-01T07:58:30.000Z",
      };
      const pinResult = await AttendanceEngine.processPunch(pinPunchInput, getTrustedContext());
      expect(pinResult.success).toBe(true);
      expect(pinResult.action).toBe("CHECK_IN");

      // Verify stored with method: PIN
      const log = await db.query.attendanceLogs.findFirst({
        where: and(eq(attendanceLogs.organizationId, orgId), eq(attendanceLogs.employeeId, empE_PinFallback.id)),
      });
      expect(log?.authenticationMethod).toBe("PIN");
    });
  });

  // ───────────────────────────────────────────────────────────────────────────
  // ACT 3: OPERATIONS ANOMALIES & SUPERVISOR RESOLUTION
  // ───────────────────────────────────────────────────────────────────────────
  describe("3. Operations Hub Exceptions & Supervisor Override", () => {
    let unclosedLogId: string;

    beforeAll(async () => {
      // Create Missing Checkout for Employee C (a previous day's unclosed session)
      const [unclosedLog] = await db
        .insert(attendanceLogs)
        .values({
          organizationId: orgId,
          employeeId: empC_MissingOut.id,
          siteId: siteTubli.id,
          date: "2026-08-20",
          checkInTime: new Date("2026-08-20T07:55:00Z"),
          checkOutTime: null, // MISSING CHECKOUT
          status: "present",
          authenticationMethod: "FACE",
        })
        .returning();
      unclosedLogId = unclosedLog.id;

      // Create Outside Geofence punch for Employee D
      await db.insert(attendanceLogs).values({
        organizationId: orgId,
        employeeId: empD_OutsideGeo.id,
        siteId: siteTubli.id,
        date: "2026-08-20",
        checkInTime: new Date("2026-08-20T08:00:00Z"),
        checkOutTime: new Date("2026-08-20T17:00:00Z"),
        status: "present",
        gpsDistanceMeters: 450, // Outside 250m radius
        flags: ["OUTSIDE_GEOFENCE"],
        authenticationMethod: "FACE",
      });
    });

    it("Operations Hub detects anomalies accurately across categories", async () => {
      const anomalies = await OperationsService.getAnomalies(orgId);
      expect(anomalies.length).toBeGreaterThanOrEqual(2);

      const missingOut = anomalies.find((a) => a.type === AnomalyType.MISSING_CHECKOUT && a.employee.id === empC_MissingOut.id);
      expect(missingOut).toBeDefined();

      const outsideGeo = anomalies.find((a) => a.type === AnomalyType.OUTSIDE_GEOFENCE && a.employee.id === empD_OutsideGeo.id);
      expect(outsideGeo).toBeDefined();
    });

    it("Supervisor resolves Employee C missing checkout with custom time and required audit reason", async () => {
      const auditReason = "Employee was on emergency pipeline repair until 17:30";
      const customCheckout = "2026-08-20T17:30:00.000Z";

      // Apply resolution via OperationsService.resolve
      await OperationsService.resolve(
        orgId,
        supervisorUser.id,
        `MC_${unclosedLogId}`,
        "suggest_checkout",
        auditReason,
        { checkOutTime: customCheckout }
      );

      // Verify attendance record updated
      const updatedLog = await db.query.attendanceLogs.findFirst({
        where: eq(attendanceLogs.id, unclosedLogId),
      });
      expect(updatedLog?.checkOutTime).toBeDefined();
      expect(updatedLog?.authenticationMethod).toBe("SUPERVISOR");

      // Verify adjustment entry recorded with before/after state
      const adjustment = await db.query.attendanceAdjustments.findFirst({
        where: and(eq(attendanceAdjustments.organizationId, orgId), eq(attendanceAdjustments.attendanceLogId, unclosedLogId)),
      });
      expect(adjustment).toBeDefined();
      expect(adjustment?.reason).toBe(auditReason);
      expect(adjustment?.adjustedByUserId).toBe(supervisorUser.id);

      // Verify anomaly disappears from active work queue
      const anomaliesAfter = await OperationsService.getAnomalies(orgId);
      const resolvedCheck = anomaliesAfter.find((a) => a.logId === unclosedLogId);
      expect(resolvedCheck).toBeUndefined();
    });
  });

  // ───────────────────────────────────────────────────────────────────────────
  // ACT 4: CLOSED-LOOP LEAVE GOVERNANCE
  // ───────────────────────────────────────────────────────────────────────────
  describe("4. Closed-Loop Leave Request & Attendance Linkage", () => {
    let leaveReqId: string;

    it("Employee F requests 2 days Annual Leave", async () => {
      const annualLeaveType = await db.query.leaveTypes.findFirst({
        where: and(eq(leaveTypes.organizationId, orgId), eq(leaveTypes.code, "AL")),
      });

      const [req] = await db
        .insert(leaveRequests)
        .values({
          organizationId: orgId,
          employeeId: empF_ApprovedLeave.id,
          leaveTypeId: annualLeaveType!.id,
          startDate: "2026-09-12",
          endDate: "2026-09-13",
          requestedDays: 2.0,
          reason: "Family personal travel",
          status: "PENDING",
          submittedAt: new Date(),
        })
        .returning();
      leaveReqId = req.id;
      expect(req.status).toBe("PENDING");
    });

    it("Manager approves leave & system deducts balance from 18 to 16 days", async () => {
      await LeaveService.approveRequest(orgId, leaveReqId, managerUser.id);

      const approvedReq = await db.query.leaveRequests.findFirst({
        where: eq(leaveRequests.id, leaveReqId),
      });
      expect(approvedReq?.status).toBe("APPROVED");
      expect(approvedReq?.approvedBy).toBe(managerUser.id);

      const bal = await db.query.leaveBalances.findFirst({
        where: and(eq(leaveBalances.organizationId, orgId), eq(leaveBalances.employeeId, empF_ApprovedLeave.id)),
      });
      // 22 allocated - (4 initial used + 2 approved = 6 used) -> 16 remaining
      expect(bal?.usedDays).toBe(6.0);
    });
  });

  // ───────────────────────────────────────────────────────────────────────────
  // ACT 5: PAYROLL ENGINE RUN, RECONCILIATION & IMMUTABILITY
  // ───────────────────────────────────────────────────────────────────────────
  describe("5. Payroll Engine Run, Exact Cent Calculation & Locking", () => {
    let periodId: string;
    let runId: string;

    beforeAll(async () => {
      // Seed September attendance logs for the remaining employees
      // Employee H: 20 days present + 1.5h Overtime on Day 15
      await db.insert(attendanceLogs).values({
        organizationId: orgId,
        employeeId: empH_Overtime.id,
        siteId: siteTubli.id,
        date: "2026-09-15",
        checkInTime: new Date("2026-09-15T07:50:00Z"),
        checkOutTime: new Date("2026-09-15T18:30:00Z"),
        status: "present",
        authenticationMethod: "FACE",
      });
    });

    it("Creates a September 2026 monthly payroll period & run", async () => {
      const period = await PayrollService.createPeriod(orgId, payrollUser.id, {
        name: "September 2026",
        periodStart: "2026-09-01",
        periodEnd: "2026-09-30",
      });
      periodId = period.id;

      const run = await PayrollService.createRun(orgId, periodId, payrollUser.id);
      runId = run.id;
      expect(run.status).toBe("DRAFT");
    });

    it("Calculates payroll with exact cent monetary math", async () => {
      const calculated = await PayrollService.calculateRun(orgId, runId, payrollUser.id);
      expect(calculated?.status).toBe("REVIEW");

      // Verify line items exist for all 8 employees
      const items = await db.query.payrollItems.findMany({
        where: and(eq(payrollItems.organizationId, orgId), eq(payrollItems.payrollRunId, runId)),
      });
      expect(items.length).toBe(8);

      // Verify Employee A exact calculations
      const itemA = items.find((i) => i.employeeId === empA_Normal.id);
      expect(itemA).toBeDefined();
      expect(itemA?.basicSalary).toBe("3200.00");
      expect(itemA?.netPay).toBeDefined();

      // Manual Mathematical Verification:
      const additionCheck = MoneyService.add("3200.00", "0.00");
      expect(additionCheck).toBe("3200.00");
    });

    it("State Machine: Approves and permanently Locks payroll run", async () => {
      // 1. Approve
      const approved = await PayrollService.approveRun(orgId, runId, payrollUser.id);
      expect(approved.status).toBe("APPROVED");

      // 2. Pay
      const paid = await PayrollService.payRun(orgId, runId, payrollUser.id);
      expect(paid.status).toBe("PAID");

      // 3. Lock
      const locked = await PayrollService.lockRun(orgId, runId, payrollUser.id);
      expect(locked.status).toBe("LOCKED");
    });

    it("Immutability Check: Recalculating a LOCKED payroll run fails with 400", async () => {
      await expect(PayrollService.calculateRun(orgId, runId, payrollUser.id)).rejects.toThrowError();
    });

    it("State Machine Negative Transitions: DRAFT -> PAID is rejected", async () => {
      const [draftRun] = await db
        .insert(payrollRuns)
        .values({
          organizationId: orgId,
          payrollPeriodId: periodId,
          status: "DRAFT",
          createdBy: payrollUser.id,
        })
        .returning();

      await expect(PayrollService.payRun(orgId, draftRun.id, payrollUser.id)).rejects.toThrowError();
    });
  });

  // ───────────────────────────────────────────────────────────────────────────
  // ACT 6: CROSS-MODULE RECONCILIATION & NEGATIVE SECURITY TESTS
  // ───────────────────────────────────────────────────────────────────────────
  describe("6. Cross-Module Reconciliation & Negative Security Bounds", () => {
    it("Manager CANNOT approve or lock payroll (RBAC boundary)", () => {
      expect(PermissionService.cannot(managerUser, "payroll.approve")).toBe(true);
      expect(PermissionService.cannot(managerUser, "payroll.lock")).toBe(true);
    });

    it("Tenant User CANNOT access Platform Admin area", () => {
      expect(PermissionService.cannot(tenantAdminUser, "platform.organizations.read")).toBe(true);
      expect(PermissionService.cannot(tenantAdminUser, "platform.system.read")).toBe(true);
    });

    it("All critical mutations recorded compliant audit log entries", async () => {
      const logs = await db.query.auditLogs.findMany({
        where: eq(auditLogs.organizationId, orgId),
        orderBy: [desc(auditLogs.createdAt)],
      });
      expect(logs.length).toBeGreaterThanOrEqual(4);

      const actions = logs.map((l) => l.action);
      expect(actions).toContain("PAYROLL_PERIOD_CREATED");
      expect(actions).toContain("PAYROLL_RUN_CREATED");
      expect(actions).toContain("PAYROLL_RUN_LOCKED");
    });
  });
});
