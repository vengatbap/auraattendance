import { describe, it } from "vitest";
import { db } from "@/db";
import { organizations, employees, faceProfiles, sites, attendanceLogs, attendanceEvents } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { AttendanceEngine } from "../engine/attendance-engine";
import { OfflineSyncService } from "../services/offline-sync.service";
import { AttendanceFlag, PunchInput, TrustedAttendanceContext } from "../types";

describe("Attendance Engine Automated Suite", () => {
  it("runs all attendance engine assertions", async () => {
    await runTests();
  }, 120000);
});

async function runTests() {
  console.log("=== STARTING ATTENDANCE ENGINE AUTOMATED TEST SUITE ===");

  // 1. Setup mock data
  const testOrgSlugA = `test-org-a-${Date.now()}`;
  const testOrgSlugB = `test-org-b-${Date.now()}`;

  // Insert Organizations
  const [orgA] = await db.insert(organizations).values({
    name: "Test Organization A",
    slug: testOrgSlugA,
    status: "active",
    subscriptionPlan: "standard",
    faceMatchThreshold: 0.6,
    timezone: "UTC",
    lateAfterTime: "23:59",
    gracePeriodMinutes: 15,
    minimumPunchGapMinutes: 0,
  }).returning();

  const [orgB] = await db.insert(organizations).values({
    name: "Test Organization B",
    slug: testOrgSlugB,
    status: "active",
    subscriptionPlan: "standard",
    faceMatchThreshold: 0.6,
    timezone: "UTC",
  }).returning();

  // Insert Sites for Org A
  const [siteA] = await db.insert(sites).values({
    organizationId: orgA.id,
    name: "HQ Site A",
    latitude: 40.7128,
    longitude: -74.0060,
    radius: 100, // 100 meters
    status: "active",
    allowedDevices: "both",
  }).returning();

  // Insert Employees for Org A and B
  const randSuffix = Math.floor(Math.random() * 100000);
  const [empA] = await db.insert(employees).values({
    organizationId: orgA.id,
    employeeCode: `EMP-A-${Date.now()}-${randSuffix}`,
    governmentId: `GOV-${Date.now()}-${randSuffix}-A`,
    name: "Employee A01",
    status: "active",
  }).returning();

  const [empB] = await db.insert(employees).values({
    organizationId: orgB.id,
    employeeCode: `EMP-B-${Date.now()}-${randSuffix}`,
    governmentId: `GOV-${Date.now()}-${randSuffix}-B`,
    name: "Employee B01",
    status: "active",
  }).returning();

  // Face profile for A01 (Embedding mock)
  const mockEmbeddingA = Array(128).fill(0.1);
  await db.insert(faceProfiles).values({
    organizationId: orgA.id,
    employeeId: empA.id,
    embedding: mockEmbeddingA,
  });

  // Face profile for B01 (Embedding mock)
  const mockEmbeddingB = Array(128).fill(0.9);
  await db.insert(faceProfiles).values({
    organizationId: orgB.id,
    employeeId: empB.id,
    embedding: mockEmbeddingB,
  });

  let testCount = 0;
  let successCount = 0;

  function assert(condition: boolean, name: string) {
    testCount++;
    if (condition) {
      successCount++;
      console.log(`[PASS] ${name}`);
    } else {
      console.error(`[FAIL] ${name}`);
      throw new Error(`Assertion failed: ${name}`);
    }
  }

  try {
    // ----------------------------------------------------
    // TEST 1: Happy CHECK_IN
    // ----------------------------------------------------
    const clientEventId1 = `evt-${Date.now()}-1`;
    const input1: PunchInput = {
      clientEventId: clientEventId1,
      descriptor: mockEmbeddingA,
      latitude: 40.7128,
      longitude: -74.0060,
      deviceInfo: "Test Device",
      browser: "Chrome",
      capturedAt: new Date().toISOString(),
    };
    const context1: TrustedAttendanceContext = {
      organizationId: orgA.id,
      requestId: "req_test_1",
      ipAddress: "127.0.0.1",
      receivedAt: new Date(),
    };

    const res1 = await AttendanceEngine.processPunch(input1, context1);
    assert(res1.success === true, "Test 1: Punch CHECK_IN success");
    assert(res1.action === "CHECK_IN", "Test 1: Punch resolves to CHECK_IN");
    assert(res1.status === "PRESENT", "Test 1: Status resolves to PRESENT (inside shift)");
    assert(res1.employee?.id === empA.id, "Test 1: Resolves matched employee ID");
    assert(res1.site?.id === siteA.id, "Test 1: Resolves matched site ID");

    // Verify raw event is saved
    const [savedEvent1] = await db.select().from(attendanceEvents).where(eq(attendanceEvents.clientEventId, clientEventId1));
    assert(!!savedEvent1, "Test 1: Event saved in database");
    assert(savedEvent1.outcome === "ACCEPTED", "Test 1: Event outcome matches ACCEPTED");

    // Verify attendance log session is created
    const [log1] = await db.select().from(attendanceLogs).where(
      and(
        eq(attendanceLogs.organizationId, orgA.id),
        eq(attendanceLogs.employeeId, empA.id)
      )
    );
    assert(!!log1, "Test 1: Attendance session log created");
    assert(log1.checkOutTime === null, "Test 1: Log checkout is null");

    // ----------------------------------------------------
    // TEST 2: Idempotency Replay on Event 1
    // ----------------------------------------------------
    const res2 = await AttendanceEngine.processPunch(input1, context1);
    assert(res2.success === true, "Test 2: Replay request success");
    assert(res2.requestId === "req_test_1", "Test 2: Returns original requestId");

    // Count events in DB for Event 1 (should remain exactly 1)
    const eventsForId1 = await db.select().from(attendanceEvents).where(eq(attendanceEvents.clientEventId, clientEventId1));
    assert(eventsForId1.length === 1, "Test 2: No duplicate attendanceEvent inserted");

    // ----------------------------------------------------
    // TEST 3: Happy CHECK_OUT (Sequenced)
    // ----------------------------------------------------
    const clientEventId2 = `evt-${Date.now()}-2`;
    const input2: PunchInput = {
      clientEventId: clientEventId2,
      descriptor: mockEmbeddingA,
      latitude: 40.7128,
      longitude: -74.0060,
      capturedAt: new Date().toISOString(),
    };
    const context2: TrustedAttendanceContext = {
      organizationId: orgA.id,
      requestId: "req_test_2",
      ipAddress: "127.0.0.1",
      receivedAt: new Date(),
    };

    const res3 = await AttendanceEngine.processPunch(input2, context2);
    assert(res3.success === true, "Test 3: Punch CHECK_OUT success");
    assert(res3.action === "CHECK_OUT", "Test 3: Punch resolves to CHECK_OUT");

    // Verify attendance log session is updated
    const [log2] = await db.select().from(attendanceLogs).where(
      and(
        eq(attendanceLogs.organizationId, orgA.id),
        eq(attendanceLogs.employeeId, empA.id)
      )
    );
    assert(log2.checkOutTime !== null, "Test 3: Log checkout time has been recorded");

    // ----------------------------------------------------
    // TEST 4: Outside Geofence Punch
    // ----------------------------------------------------
    const clientEventId3 = `evt-${Date.now()}-3`;
    const input3: PunchInput = {
      clientEventId: clientEventId3,
      descriptor: mockEmbeddingA,
      latitude: 50.0, // Far away coordinates
      longitude: 10.0,
      capturedAt: new Date().toISOString(),
    };
    const context3: TrustedAttendanceContext = {
      organizationId: orgA.id,
      requestId: "req_test_3",
      ipAddress: "127.0.0.1",
      receivedAt: new Date(),
    };

    const res4 = await AttendanceEngine.processPunch(input3, context3);
    assert(res4.success === true, "Test 4: Geofence violation punch accepted (policy rule)");
    assert(res4.flags.includes(AttendanceFlag.OUTSIDE_GEOFENCE), "Test 4: OUTSIDE_GEOFENCE flag present");

    const [savedEvent3] = await db.select().from(attendanceEvents).where(eq(attendanceEvents.clientEventId, clientEventId3));
    assert(savedEvent3.outcome === "ACCEPTED_WITH_WARNING", "Test 4: Event outcome recorded as ACCEPTED_WITH_WARNING");

    // ----------------------------------------------------
    // TEST 5: Suspended Organization
    // ----------------------------------------------------
    await db.update(organizations).set({ status: "suspended" }).where(eq(organizations.id, orgA.id));
    const clientEventId4 = `evt-${Date.now()}-4`;
    const input4: PunchInput = {
      clientEventId: clientEventId4,
      descriptor: mockEmbeddingA,
      capturedAt: new Date().toISOString(),
    };
    const context5: TrustedAttendanceContext = {
      organizationId: orgA.id,
      requestId: "req_test_4",
      ipAddress: "127.0.0.1",
      receivedAt: new Date(),
    };

    const res5 = await AttendanceEngine.processPunch(input4, context5);
    assert(res5.success === false, "Test 5: Suspended tenant punch rejected");
    assert(res5.flags.includes("REJECTED_TENANT"), "Test 5: Contains REJECTED_TENANT flag");

    // Restore org A status
    await db.update(organizations).set({ status: "active" }).where(eq(organizations.id, orgA.id));

    // ----------------------------------------------------
    // TEST 6: Inactive Employee
    // ----------------------------------------------------
    await db.update(employees).set({ status: "suspended" }).where(eq(employees.id, empA.id));
    const clientEventId5 = `evt-${Date.now()}-5`;
    const input5: PunchInput = {
      clientEventId: clientEventId5,
      descriptor: mockEmbeddingA,
      capturedAt: new Date().toISOString(),
    };

    const res6 = await AttendanceEngine.processPunch(input5, context5);
    assert(res6.success === false, "Test 6: Suspended employee punch rejected");

    // Restore employee status
    await db.update(employees).set({ status: "active" }).where(eq(employees.id, empA.id));

    // ----------------------------------------------------
    // TEST 7: Cross-tenant face isolation
    // ----------------------------------------------------
    const clientEventId6 = `evt-${Date.now()}-6`;
    const input6: PunchInput = {
      clientEventId: clientEventId6,
      descriptor: mockEmbeddingA, // Embedding A belongs to Org A (empA)
      capturedAt: new Date().toISOString(),
    };
    const context6: TrustedAttendanceContext = {
      organizationId: orgB.id, // Request executed under Org B trust
      requestId: "req_test_6",
      ipAddress: "127.0.0.1",
      receivedAt: new Date(),
    };

    const res7 = await AttendanceEngine.processPunch(input6, context6);
    // Embedding A should NOT match Org B employee empB.
    assert(res7.success === false, "Test 7: Cross-tenant face search isolated");
    assert(res7.flags.includes(AttendanceFlag.FACE_NOT_REGISTERED), "Test 7: Face match failed registration check");

    // ----------------------------------------------------
    // TEST 8: Human Duplicate Punch Check
    // ----------------------------------------------------
    // Update minimum punch gap threshold
    await db.update(organizations).set({ minimumPunchGapMinutes: 30 }).where(eq(organizations.id, orgA.id));

    // Create first check-in
    const clientEventId7 = `evt-${Date.now()}-7`;
    const input7: PunchInput = {
      clientEventId: clientEventId7,
      descriptor: mockEmbeddingA,
      latitude: 40.7128,
      longitude: -74.0060,
      capturedAt: new Date().toISOString(),
    };
    await AttendanceEngine.processPunch(input7, context2);

    // Punch again within 5 minute gap (guard limit is 30 mins)
    const clientEventId8 = `evt-${Date.now()}-8`;
    const input8: PunchInput = {
      clientEventId: clientEventId8,
      descriptor: mockEmbeddingA,
      latitude: 40.7128,
      longitude: -74.0060,
      capturedAt: new Date(Date.now() + 60 * 1000).toISOString(), // 1 min later
    };

    const res8 = await AttendanceEngine.processPunch(input8, context2);
    assert(res8.success === false, "Test 8: Duplicate human punch rejected");
    assert(res8.flags.includes(AttendanceFlag.DUPLICATE_PUNCH), "Test 8: DUPLICATE_PUNCH flag present");

    // Set gap limit to 10 for subsequent sync checks
    await db.update(organizations).set({ minimumPunchGapMinutes: 10 }).where(eq(organizations.id, orgA.id));

    // ----------------------------------------------------
    // TEST 9: Offline Sync Bounded Batch
    // ----------------------------------------------------
    const clientEventId9 = `evt-sync-${Date.now()}-9`;
    const clientEventId10 = `evt-sync-${Date.now()}-10`;

    const batchPunches = [
      {
        clientEventId: clientEventId9,
        descriptor: mockEmbeddingA,
        latitude: 40.7128,
        longitude: -74.0060,
        capturedAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(), // 30 mins ago
      },
      {
        clientEventId: clientEventId10,
        descriptor: mockEmbeddingA,
        latitude: 40.7128,
        longitude: -74.0060,
        capturedAt: new Date(Date.now() - 25 * 60 * 1000).toISOString(), // 25 mins ago
      }
    ];

    const syncBase = {
      organizationId: orgA.id,
      ipAddress: "127.0.0.1",
      receivedAt: new Date(),
    };

    const syncResults = await OfflineSyncService.syncBatch(batchPunches, syncBase);
    assert(syncResults.length === 2, "Test 9: Processed batch size correct");
    assert(syncResults[0].success === true, "Test 9: First sync punch successful");
    assert(syncResults[1].flags?.includes(AttendanceFlag.DUPLICATE_PUNCH) === true, "Test 9: Second sync duplicate gap check correct");

    // ----------------------------------------------------
    // TEST 10: Clock Drift
    // ----------------------------------------------------
    const clientEventId11 = `evt-${Date.now()}-11`;
    const input11: PunchInput = {
      clientEventId: clientEventId11,
      descriptor: mockEmbeddingA,
      capturedAt: new Date(Date.now() - 60 * 60 * 1000).toISOString(), // 1 hour skew
    };

    const res11 = await AttendanceEngine.processPunch(input11, context2);
    assert(res11.success === true, "Test 10: Drift punch accepted with warning");
    assert(res11.flags.includes(AttendanceFlag.CLOCK_DRIFT), "Test 10: CLOCK_DRIFT flag registered");

    console.log(`=== TEST SUITE COMPLETED: ${successCount}/${testCount} ASSERTS PASSED ===`);

  } catch (error) {
    console.error("=== TEST SUITE FAILED ===");
    console.error(error);
    throw error;
  } finally {
    // Cleanup test data safely
    await db.delete(attendanceEvents).where(eq(attendanceEvents.organizationId, orgA.id));
    await db.delete(attendanceEvents).where(eq(attendanceEvents.organizationId, orgB.id));
    await db.delete(attendanceLogs).where(eq(attendanceLogs.organizationId, orgA.id));
    await db.delete(faceProfiles).where(eq(faceProfiles.organizationId, orgA.id));
    await db.delete(faceProfiles).where(eq(faceProfiles.organizationId, orgB.id));
    await db.delete(employees).where(eq(employees.organizationId, orgA.id));
    await db.delete(employees).where(eq(employees.organizationId, orgB.id));
    await db.delete(sites).where(eq(sites.organizationId, orgA.id));
    await db.delete(organizations).where(eq(organizations.id, orgA.id));
    await db.delete(organizations).where(eq(organizations.id, orgB.id));
    console.log("=== Cleanup completed cleanly ===");
  }
}
