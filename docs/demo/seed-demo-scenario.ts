/**
 * Deterministic Demo Seeder: Bahrain Water Services (Expanded Workforce)
 * 
 * Usage: npx tsx docs/demo/seed-demo-scenario.ts
 */

import { db } from "@/db";
import {
  organizations,
  users,
  employees,
  sites,
  departments,
  attendanceCredentials,
  leaveTypes,
  leaveBalances,
  salarySettings,
} from "@/db/schema";
import bcrypt from "bcryptjs";
import { eq, and } from "drizzle-orm";

async function main() {
  if (process.env.NODE_ENV === "production" && process.env.ALLOW_DEMO_SEED !== "true") {
    console.error("🛑 REFUSING TO SEED DEMO DATA IN PRODUCTION ENVIRONMENT!");
    console.error("Set ALLOW_DEMO_SEED=true if you explicitly intend to seed demo data.");
    process.exit(1);
  }

  console.log("🌊 Seeding Flagship Demo Scenario: Bahrain Water Services (DEMO ONLY)...");

  const passwordHash = await bcrypt.hash("Demo1234!", 10);
  const defaultPinHash = await bcrypt.hash("4821", 10);

  // 1. Organization
  let [org] = await db
    .select()
    .from(organizations)
    .where(eq(organizations.slug, "bahrain-water"));

  if (!org) {
    const [newOrg] = await db
      .insert(organizations)
      .values({
        name: "Bahrain Water Services",
        slug: "bahrain-water",
        subscriptionPlan: "enterprise",
        status: "active",
        attendanceFaceEnabled: true,
        attendancePinFallbackEnabled: true,
      })
      .returning();
    org = newOrg;
  }
  console.log(`✓ Organization ready: ${org.name} (${org.id})`);

  // 2. Demo Users (Super Admin, Tenant Admin, Manager, Supervisor, Payroll Officer, Viewer)
  const usersToSeed = [
    { email: "admin@platform.aura", name: "Alex Morgan", role: "super_admin" as const, isPlatformUser: true },
    { email: "admin@bahrainwater.com", name: "Tariq Al-Mansoor", role: "admin" as const, isPlatformUser: false },
    { email: "manager.ops@bahrainwater.com", name: "Fatima Al-Zaabi", role: "manager" as const, isPlatformUser: false },
    { email: "supervisor@bahrainwater.com", name: "Khalid Al-Shamsi", role: "manager" as const, isPlatformUser: false },
    { email: "payroll@bahrainwater.com", name: "Layla Al-Hosani", role: "admin" as const, isPlatformUser: false },
    { email: "auditor@bahrainwater.com", name: "Zaid Al-Harbi", role: "viewer" as const, isPlatformUser: false },
  ];

  for (const u of usersToSeed) {
    const existing = await db.query.users.findFirst({
      where: eq(users.email, u.email),
    });
    if (!existing) {
      await db.insert(users).values({
        organizationId: u.isPlatformUser ? null : org.id,
        email: u.email,
        passwordHash,
        name: u.name,
        role: u.role,
        isPlatformUser: u.isPlatformUser,
      });
    }
  }
  console.log("✓ Demo Users provisioned.");

  // 3. Departments
  const deptNames = ["Water Distribution", "Plant Maintenance", "Quality & Safety"];
  const deptMap = new Map<string, string>();

  for (const dName of deptNames) {
    let [d] = await db
      .select()
      .from(departments)
      .where(and(eq(departments.organizationId, org.id), eq(departments.name, dName)));
    if (!d) {
      const [newD] = await db
        .insert(departments)
        .values({ organizationId: org.id, name: dName })
        .returning();
      d = newD;
    }
    deptMap.set(dName, d.id);
  }

  // 4. Sites (Tubli Pumping Station, Sitra Desalination, Hidd Pumping Station)
  const sitesData = [
    { name: "Tubli Pumping Station", lat: 26.2089, lng: 50.5577, radius: 250 },
    { name: "Sitra Desalination Plant", lat: 26.1550, lng: 50.6200, radius: 300 },
    { name: "Hidd Pumping Station", lat: 26.2450, lng: 50.6650, radius: 200 },
  ];
  const siteMap = new Map<string, string>();

  for (const s of sitesData) {
    let [st] = await db
      .select()
      .from(sites)
      .where(and(eq(sites.organizationId, org.id), eq(sites.name, s.name)));
    if (!st) {
      const [newSt] = await db
        .insert(sites)
        .values({
          organizationId: org.id,
          name: s.name,
          latitude: s.lat,
          longitude: s.lng,
          radius: s.radius,
          status: "active",
        })
        .returning();
      st = newSt;
    }
    siteMap.set(s.name, st.id);
  }
  console.log("✓ Geofenced Sites created.");

  // 5. 8 Realistic Employees
  const employeeRoster = [
    { code: "BWS-1042", gov: "CPR-890214-5512", name: "Ahmed Hassan", dept: "Water Distribution", site: "Tubli Pumping Station", desig: "Field Maintenance Engineer", salary: "3200.00" },
    { code: "BWS-1043", gov: "CPR-910522-3341", name: "Mariam Al-Hashimi", dept: "Quality & Safety", site: "Tubli Pumping Station", desig: "Water Quality Chemist", salary: "3400.00" },
    { code: "BWS-1044", gov: "CPR-880911-6622", name: "Yousef Al-Shamsi", dept: "Plant Maintenance", site: "Sitra Desalination Plant", desig: "Senior Mechanical Technician", salary: "2900.00" },
    { code: "BWS-1045", gov: "CPR-930419-7711", name: "Noura Al-Marzouqi", dept: "Water Distribution", site: "Tubli Pumping Station", desig: "SCADA Control Specialist", salary: "3100.00" },
    { code: "BWS-1046", gov: "CPR-870303-1199", name: "Omar Al-Qubaisi", dept: "Plant Maintenance", site: "Hidd Pumping Station", desig: "Electrical Systems Engineer", salary: "3500.00" },
    { code: "BWS-1047", gov: "CPR-950815-4422", name: "Aisha Al-Dhaheri", dept: "Quality & Safety", site: "Sitra Desalination Plant", desig: "Environmental Health Officer", salary: "2800.00" },
    { code: "BWS-1048", gov: "CPR-901112-8833", name: "Sami Al-Neyadi", dept: "Water Distribution", site: "Hidd Pumping Station", desig: "Pipeline Pressure Technician", salary: "2600.00" },
    { code: "BWS-1049", gov: "CPR-940728-9955", name: "Dana Al-Habsi", dept: "Plant Maintenance", site: "Tubli Pumping Station", desig: "Intake Valve Inspector", salary: "2750.00" },
  ];

  // 6. Leave Types
  let [annualLeave] = await db
    .select()
    .from(leaveTypes)
    .where(and(eq(leaveTypes.organizationId, org.id), eq(leaveTypes.code, "AL")));

  if (!annualLeave) {
    const [lt] = await db
      .insert(leaveTypes)
      .values({ organizationId: org.id, name: "Annual Leave", code: "AL", annualAllowance: 22, isPaid: true })
      .returning();
    annualLeave = lt;
  }

  for (const emp of employeeRoster) {
    let [e] = await db
      .select()
      .from(employees)
      .where(and(eq(employees.organizationId, org.id), eq(employees.employeeCode, emp.code)));

    if (!e) {
      const [newE] = await db
        .insert(employees)
        .values({
          organizationId: org.id,
          departmentId: deptMap.get(emp.dept),
          siteId: siteMap.get(emp.site),
          employeeCode: emp.code,
          governmentId: emp.gov,
          name: emp.name,
          email: `${emp.code.toLowerCase()}@bahrainwater.com`,
          phone: "+973-3912-0000",
          designation: emp.desig,
          status: "active",
          isActive: true,
        })
        .returning();
      e = newE;
    }

    // Credentials (PIN: 4821)
    const existingCred = await db.query.attendanceCredentials.findFirst({
      where: and(eq(attendanceCredentials.organizationId, org.id), eq(attendanceCredentials.employeeId, e.id)),
    });
    if (!existingCred) {
      await db.insert(attendanceCredentials).values({
        organizationId: org.id,
        employeeId: e.id,
        pinHash: defaultPinHash,
        failedAttempts: 0,
      });
    }

    // Salary Setting
    const existingSal = await db.query.salarySettings.findFirst({
      where: and(eq(salarySettings.organizationId, org.id), eq(salarySettings.employeeId, e.id)),
    });
    if (!existingSal) {
      await db.insert(salarySettings).values({
        organizationId: org.id,
        employeeId: e.id,
        currency: "BHD",
        payFrequency: "monthly",
        basicSalary: emp.salary,
        overtimeRate: "1.50",
        workingDaysPerPeriod: "22",
        workingHoursPerDay: "8",
        effectiveFrom: "2026-01-01",
        status: "ACTIVE",
      });
    }

    // Leave Balance
    const existingBal = await db.query.leaveBalances.findFirst({
      where: and(eq(leaveBalances.organizationId, org.id), eq(leaveBalances.employeeId, e.id)),
    });
    if (!existingBal) {
      await db.insert(leaveBalances).values({
        organizationId: org.id,
        employeeId: e.id,
        leaveTypeId: annualLeave.id,
        year: 2026,
        allocatedDays: 22.0,
        usedDays: 4.0,
        pendingDays: 0.0,
        status: "ACTIVE",
      });
    }
  }

  console.log("\n=======================================================");
  console.log("🎉 FLAGSHIP DEMO WORKFORCE SUCCESSFULLY SEEDED (8 EMPLOYEES)!");
  console.log("=======================================================");
  console.log("Organization: Bahrain Water Services (bws)");
  console.log("Super Admin:  admin@platform.aura (Demo1234!)");
  console.log("Tenant Admin: admin@bahrainwater.com (Demo1234!)");
  console.log("Manager:      manager.ops@bahrainwater.com (Demo1234!)");
  console.log("Supervisor:   supervisor@bahrainwater.com (Demo1234!)");
  console.log("Payroll Mgr:  payroll@bahrainwater.com (Demo1234!)");
  console.log("Auditor:      auditor@bahrainwater.com (Demo1234!)");
  console.log("Hero Worker:  Ahmed Hassan (BWS-1042 | PIN: 4821)");
  console.log("Sites:        Tubli Pumping, Sitra Desalination, Hidd Pumping");
  console.log("=======================================================\n");
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("Seeding failed:", err);
    process.exit(1);
  });
