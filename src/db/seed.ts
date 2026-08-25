import { db } from "./index";
import { organizations, users, employees, sites, departments, attendanceLogs } from "./schema";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { DEFAULT_ORGANIZATION } from "@/constants";

// ─── Helpers ────────────────────────────────────────────────────────────────

function randomBetween(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomChoice<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function daysAgo(n: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d;
}

function todayAt(hour: number, min: number): Date {
  const d = new Date();
  d.setHours(hour, min, 0, 0);
  return d;
}

function dateNDaysAgo(n: number): string {
  const d = daysAgo(n);
  return d.toISOString().split("T")[0];
}

// ─── Master Data ─────────────────────────────────────────────────────────────

const DEPARTMENTS = [
  "Operations",
  "Engineering",
  "Finance",
  "Human Resources",
  "Sales",
  "Customer Service",
  "Logistics",
  "IT Support",
  "Security",
  "Administration",
];

const DESIGNATIONS = [
  "Senior Engineer",
  "Junior Engineer",
  "Team Lead",
  "Manager",
  "Supervisor",
  "Analyst",
  "Coordinator",
  "Executive",
  "Officer",
  "Specialist",
  "Assistant",
  "Technician",
];

const EMPLOYEE_NAMES = [
  "Mohammed Al Rashid",
  "Fatima Al Zaabi",
  "Ahmed Al Mansoori",
  "Mariam Al Hashimi",
  "Khalid Al Shamsi",
  "Noura Al Marzouqi",
  "Omar Al Qubaisi",
  "Hessa Al Nuaimi",
  "Saeed Al Ketbi",
  "Latifa Al Falasi",
  "Hamdan Al Kaabi",
  "Sheikha Al Kindi",
  "Rashid Al Muhairi",
  "Aisha Al Dhaheri",
  "Sultan Al Ameri",
  "Moza Al Remeithi",
  "Majid Al Mazrouei",
  "Reem Al Suwaidi",
  "Jassim Al Blooshi",
  "Dana Al Habsi",
  "Tariq Al Hammadi",
  "Shams Al Zarooni",
  "Sami Al Neyadi",
  "Hind Al Breiki",
  "Yousef Al Shamsi",
  "Raja Al Mazroui",
  "Walid Al Jaberi",
  "Ghada Al Qubaisi",
  "Ibrahim Al Zaabi",
  "Sara Al Mansouri",
  "Ali Hassan Al Farsi",
  "Nadia Mohammed",
  "Faisal Al Rashidi",
  "Layla Al Hosani",
  "Hassan Al Mualla",
  "Rania Khalid",
  "Bilal Al Shamsi",
  "Maryam Ibrahim",
  "Adnan Al Naqbi",
  "Hala Saeed",
  "Talal Al Ketbi",
  "Dina Al Falasi",
  "Khaled Mohammed",
  "Rana Al Kaabi",
  "Naif Al Ameri",
  "Salma Al Dhaheri",
  "Zayed Al Muhairi",
  "Amira Al Nuaimi",
  "Essa Al Marzouqi",
  "Lulua Al Hashimi",
];

const SITES_DATA = [
  { name: "Headquarters - Dubai", lat: 25.2048, lng: 55.2708, radius: 100 },
  { name: "Musalla Business Square", lat: 25.2638, lng: 55.3117, radius: 80 },
  { name: "Hoora Branch", lat: 26.2285, lng: 50.5860, radius: 75 },
  { name: "Al Quoz Industrial", lat: 25.1439, lng: 55.2197, radius: 120 },
  { name: "Downtown Office Tower", lat: 25.1972, lng: 55.2744, radius: 60 },
];

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log("🌱 Starting comprehensive database seed...");

  // ── 1. Organizations ──────────────────────────────────────────────────────
  const orgsToSeed = [
    { ...DEFAULT_ORGANIZATION, subscriptionPlan: "enterprise", isOnboarded: true },
    { name: "Acme Corporation", slug: "acme-corp", subscriptionPlan: "standard" },
    { name: "Global Logistics Inc.", slug: "global-logistics", subscriptionPlan: "standard" },
    { name: "Stark Industries", slug: "stark-industries", subscriptionPlan: "enterprise" },
    { name: "Wayne Enterprises", slug: "wayne-enterprises", subscriptionPlan: "trial" },
    { name: "Initech LLC", slug: "initech", subscriptionPlan: "trial" },
  ];

  let auraOrgId: string | null = null;

  for (const org of orgsToSeed) {
    const existing = await db.select().from(organizations).where(eq(organizations.slug, org.slug)).limit(1);
    let orgId: string;
    if (existing.length === 0) {
      const [created] = await db.insert(organizations).values(org).returning();
      orgId = created.id;
      console.log(`✅ Organization created: ${org.name}`);
    } else {
      orgId = existing[0].id;
      console.log(`⏭  Organization already exists: ${org.name}`);
    }
    if (org.slug === DEFAULT_ORGANIZATION.slug) {
      auraOrgId = orgId;
    }
  }

  if (!auraOrgId) {
    throw new Error("Could not resolve Aura Demo Organization ID");
  }

  // ── 2. Super Admin ────────────────────────────────────────────────────────
  const existingAdmin = await db.select().from(users).where(eq(users.email, "admin@aura.com")).limit(1);
  if (existingAdmin.length === 0) {
    const passwordHash = await bcrypt.hash("admin123", 10);
    await db.insert(users).values({
      organizationId: null,
      email: "admin@aura.com",
      passwordHash,
      name: "Master Admin",
      role: "super_admin",
      isPlatformUser: true,
    });
    console.log("✅ Super Admin created: admin@aura.com / admin123");
  } else {
    console.log("⏭  Super Admin already exists.");
  }

  // ── 3. Tenant Admin for Aura Demo ────────────────────────────────────────
  const existingTenantAdmin = await db.select().from(users).where(eq(users.email, "manager@aura-demo.com")).limit(1);
  let tenantAdminId: string;
  if (existingTenantAdmin.length === 0) {
    const passwordHash = await bcrypt.hash("demo1234", 10);
    const [created] = await db.insert(users).values({
      organizationId: auraOrgId,
      email: "manager@aura-demo.com",
      passwordHash,
      name: "Demo Manager",
      role: "admin",
      isPlatformUser: false,
    }).returning();
    tenantAdminId = created.id;
    console.log("✅ Tenant Admin created: manager@aura-demo.com / demo1234");
  } else {
    tenantAdminId = existingTenantAdmin[0].id;
    console.log("⏭  Tenant Admin already exists.");
  }

  // ── 4. Sites for Aura Demo ────────────────────────────────────────────────
  const siteIds: string[] = [];
  for (const siteData of SITES_DATA) {
    const [created] = await db.insert(sites).values({
      organizationId: auraOrgId,
      name: siteData.name,
      latitude: siteData.lat,
      longitude: siteData.lng,
      radius: siteData.radius,
      status: "active",
    }).returning();
    siteIds.push(created.id);
    console.log(`✅ Site created: ${siteData.name}`);
  }

  // ── 5. Departments for Aura Demo ─────────────────────────────────────────
  const departmentIds: string[] = [];
  for (const deptName of DEPARTMENTS) {
    const [created] = await db.insert(departments).values({
      organizationId: auraOrgId,
      name: deptName,
      status: "active",
    }).returning();
    departmentIds.push(created.id);
    console.log(`✅ Department created: ${deptName}`);
  }

  // ── 6. 50 Employees for Aura Demo ─────────────────────────────────────────
  console.log("🧑‍💼 Creating 50 employees...");
  const employeeIds: string[] = [];

  // Check how many employees already exist
  const existingEmployees = await db.select().from(employees)
    .where(eq(employees.organizationId, auraOrgId));
  
  if (existingEmployees.length >= 50) {
    console.log(`⏭  Employees already seeded (${existingEmployees.length} found). Skipping.`);
    existingEmployees.forEach(e => employeeIds.push(e.id));
  } else {
    for (let i = 0; i < 50; i++) {
      const name = EMPLOYEE_NAMES[i];
      const empCode = `EMP-${String(i + 1).padStart(3, "0")}`;
      const govId = `UAE-${String(100000 + i)}`;
      const deptId = departmentIds[i % departmentIds.length];
      const deptName = DEPARTMENTS[i % DEPARTMENTS.length];
      const siteId = siteIds[i % siteIds.length];
      const designation = randomChoice(DESIGNATIONS);
      const isActive = i < 45; // 5 inactive employees

      const [emp] = await db.insert(employees).values({
        organizationId: auraOrgId,
        employeeCode: empCode,
        governmentId: govId,
        name,
        siteId,
        department: deptName,
        departmentId: deptId,
        designation,
        phone: `+9715${String(randomBetween(10000000, 99999999))}`,
        email: `${name.toLowerCase().replace(/\s+/g, ".").replace(/[^a-z.]/g, "")}@aura-demo.com`,
        status: isActive ? "active" : "inactive",
        isActive,
      }).returning();

      employeeIds.push(emp.id);
    }
    console.log(`✅ 50 employees created.`);
  }

  // ── 7. Attendance Logs — Last 14 Days ────────────────────────────────────
  console.log("📋 Seeding attendance logs for the last 14 days...");

  // Check existing logs to avoid duplicates
  const existingLogs = await db.select({ id: attendanceLogs.id })
    .from(attendanceLogs)
    .where(eq(attendanceLogs.organizationId, auraOrgId))
    .limit(1);

  if (existingLogs.length > 0) {
    console.log("⏭  Attendance logs already exist. Skipping.");
  } else {
    const logsToInsert: (typeof attendanceLogs.$inferInsert)[] = [];

    for (let dayOffset = 14; dayOffset >= 0; dayOffset--) {
      const dateStr = dateNDaysAgo(dayOffset);
      const isToday = dayOffset === 0;
      const isWeekend = new Date(dateStr).getDay() === 5 || new Date(dateStr).getDay() === 6; // Fri/Sat

      if (isWeekend) continue; // Skip weekends

      for (let empIdx = 0; empIdx < employeeIds.length; empIdx++) {
        const empId = employeeIds[empIdx];
        const siteId = siteIds[empIdx % siteIds.length];

        // 15% absence rate, 10% late rate
        const roll = Math.random();
        if (roll < 0.15) continue; // absent — no record

        const isLate = roll < 0.25;
        const checkInHour = isLate ? randomBetween(9, 10) : randomBetween(7, 9);
        const checkInMin = randomBetween(0, 59);
        const workDuration = randomBetween(7, 10); // hours worked

        const checkInTime = new Date(`${dateStr}T${String(checkInHour).padStart(2, "0")}:${String(checkInMin).padStart(2, "0")}:00`);

        // For today: ~40% have not checked out yet (still at work)
        const hasMissingCheckout = isToday && Math.random() < 0.4;
        const checkOutTime = hasMissingCheckout
          ? null
          : new Date(checkInTime.getTime() + workDuration * 60 * 60 * 1000);

        // Some geofence outliers
        const gpsDistance = Math.random() < 0.05 ? randomBetween(60, 250) : randomBetween(0, 40);

        // Confidence score variation
        const confidenceScore = Math.random() < 0.08 ? Math.random() * 0.3 + 0.3 : Math.random() * 0.2 + 0.8;

        logsToInsert.push({
          organizationId: auraOrgId,
          employeeId: empId,
          siteId,
          date: dateStr,
          checkInTime,
          checkOutTime,
          status: isLate ? "late" : "present",
          confidenceScore,
          gpsDistanceMeters: gpsDistance,
          gpsLatitude: SITES_DATA[empIdx % SITES_DATA.length].lat + (Math.random() - 0.5) * 0.001,
          gpsLongitude: SITES_DATA[empIdx % SITES_DATA.length].lng + (Math.random() - 0.5) * 0.001,
          punchType: "in",
          flags: gpsDistance > 50 ? JSON.stringify(["OUTSIDE_GEOFENCE"]) : JSON.stringify([]),
          isOffline: Math.random() < 0.03,
        });
      }
    }

    // Batch insert in chunks of 100
    const chunkSize = 100;
    for (let i = 0; i < logsToInsert.length; i += chunkSize) {
      const chunk = logsToInsert.slice(i, i + chunkSize);
      await db.insert(attendanceLogs).values(chunk);
    }

    console.log(`✅ ${logsToInsert.length} attendance log entries created.`);
  }

  console.log("\n🎉 Seed complete!");
  console.log("─────────────────────────────────────────────────────");
  console.log("Super Admin:    admin@aura.com        / admin123");
  console.log("Tenant Admin:   manager@aura-demo.com / demo1234");
  console.log("Organization:   AURA Demo Organization (aura-demo)");
  console.log("Employees:      50 employees across 5 departments");
  console.log("Sites:          5 sites");
  console.log("Attendance:     ~14 days of realistic logs");
  console.log("─────────────────────────────────────────────────────");
}

main().catch((err) => {
  console.error("❌ Error seeding:", err);
  process.exit(1);
});
