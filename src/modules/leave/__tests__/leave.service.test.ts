import { db } from "@/db";
import { organizations, employees, users, leaveTypes, leaveBalances, leaveRequests } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { LeaveService } from "../service/leave.service";
import { LeaveBalanceRepository } from "../repository/leave-balance.repository";
import { AppError } from "@/lib/errors";
import { LeaveTypeRepository } from "../repository/leave-type.repository";

async function runTests() {
  console.log("=== STARTING LEAVE ENGINE AUTOMATED TEST SUITE ===");

  // 1. Setup mock data
  const testOrgSlugA = `test-org-a-${Date.now()}`;
  const testOrgSlugB = `test-org-b-${Date.now()}`;

  const [orgA] = await db.insert(organizations).values({
    name: "Test Organization A",
    slug: testOrgSlugA,
    status: "active",
    subscriptionPlan: "standard",
  }).returning();

  const [orgB] = await db.insert(organizations).values({
    name: "Test Organization B",
    slug: testOrgSlugB,
    status: "active",
    subscriptionPlan: "standard",
  }).returning();

  const [adminA] = await db.insert(users).values({
    organizationId: orgA.id,
    email: `admin-a-${Date.now()}@example.com`,
    name: "Admin A",
    passwordHash: "dummy-hash",
    role: "admin",
  }).returning();

  const [empA] = await db.insert(employees).values({
    organizationId: orgA.id,
    employeeCode: `EMP-A-${Date.now()}`,
    governmentId: `GOV-A-${Date.now()}`,
    name: "Employee A01",
    status: "active",
  }).returning();

  const [empB] = await db.insert(employees).values({
    organizationId: orgB.id,
    employeeCode: `EMP-B-${Date.now()}`,
    governmentId: `GOV-B-${Date.now()}`,
    name: "Employee B01",
    status: "active",
  }).returning();

  // Create Leave Types
  const [annualType] = await db.insert(leaveTypes).values({
    organizationId: orgA.id,
    code: "ANNUAL",
    name: "Annual Leave",
    isPaid: true,
    annualAllowance: 20,
    requiresApproval: true,
  }).returning();

  const [sickType] = await db.insert(leaveTypes).values({
    organizationId: orgA.id,
    code: "SICK",
    name: "Sick Leave",
    isPaid: true,
    annualAllowance: 10,
    requiresApproval: true,
  }).returning();

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
    const currentYear = new Date().getFullYear();

    // Setup initial balance for empA
    await LeaveBalanceRepository.create({
      organizationId: orgA.id,
      employeeId: empA.id,
      leaveTypeId: annualType.id,
      year: currentYear,
      allocatedDays: 20,
      usedDays: 0,
      pendingDays: 0,
    });

    // ----------------------------------------------------
    // TEST 1: Submit Leave Request
    // ----------------------------------------------------
    const startDate = `${currentYear}-09-01`;
    const endDate = `${currentYear}-09-05`;
    const req1 = await LeaveService.submitRequest(orgA.id, empA.id, annualType.id, startDate, endDate, 5, "Vacation");
    
    assert(req1.status === "PENDING", "Test 1: Request is PENDING");
    assert(req1.requestedDays === 5, "Test 1: Requested days match");
    
    const balanceAfterSubmit = await LeaveBalanceRepository.findByEmployeeAndType(orgA.id, empA.id, annualType.id, currentYear);
    assert(balanceAfterSubmit?.pendingDays === 5, "Test 1: Pending days incremented");

    // ----------------------------------------------------
    // TEST 2: Approve Leave Request
    // ----------------------------------------------------
    const approvedReq1 = await LeaveService.approveRequest(orgA.id, req1.id, adminA.id);
    assert(approvedReq1.status === "APPROVED", "Test 2: Request is APPROVED");
    assert(approvedReq1.approvedBy === adminA.id, "Test 2: Approved by recorded");

    const balanceAfterApprove = await LeaveBalanceRepository.findByEmployeeAndType(orgA.id, empA.id, annualType.id, currentYear);
    assert(balanceAfterApprove?.pendingDays === 0, "Test 2: Pending days decremented");
    assert(balanceAfterApprove?.usedDays === 5, "Test 2: Used days incremented");

    // ----------------------------------------------------
    // TEST 3: Insufficient Balance
    // ----------------------------------------------------
    let insufficientFailed = false;
    try {
      await LeaveService.submitRequest(orgA.id, empA.id, annualType.id, `${currentYear}-10-01`, `${currentYear}-10-16`, 16, "Long Vacation");
    } catch (e: unknown) {
      if (e instanceof AppError && e.code === "LEAVE_INSUFFICIENT_BALANCE") {
        insufficientFailed = true;
      }
    }
    assert(insufficientFailed, "Test 3: Insufficient balance caught");

    // ----------------------------------------------------
    // TEST 4: Invalid State Transition (Approve already approved)
    // ----------------------------------------------------
    let stateFailed = false;
    try {
      await LeaveService.approveRequest(orgA.id, req1.id, adminA.id);
    } catch (e: unknown) {
      if (e instanceof AppError && e.code === "LEAVE_INVALID_STATE") {
        stateFailed = true;
      }
    }
    assert(stateFailed, "Test 4: Invalid state transition prevented");

    // ----------------------------------------------------
    // TEST 5: Overlapping Request
    // ----------------------------------------------------
    let overlapFailed = false;
    try {
      await LeaveService.submitRequest(orgA.id, empA.id, annualType.id, `${currentYear}-09-03`, `${currentYear}-09-07`, 5, "Overlap");
    } catch (e: unknown) {
      if (e instanceof AppError && e.code === "LEAVE_OVERLAPPING_REQUEST") {
        overlapFailed = true;
      }
    }
    assert(overlapFailed, "Test 5: Overlapping request prevented");

    // ----------------------------------------------------
    // TEST 6: Tenant Isolation
    // ----------------------------------------------------
    let tenantIsolated = false;
    try {
      // Try to approve an OrgA request under OrgB context
      await LeaveService.approveRequest(orgB.id, req1.id, adminA.id);
    } catch (e: unknown) {
      if (e instanceof AppError && e.code === "LEAVE_REQUEST_NOT_FOUND") {
        tenantIsolated = true;
      }
    }
    assert(tenantIsolated, "Test 6: Tenant isolation enforced");

    // ----------------------------------------------------
    // TEST 7: Cancel Request
    // ----------------------------------------------------
    const cancelledReq1 = await LeaveService.cancelRequest(orgA.id, req1.id, adminA.id);
    assert(cancelledReq1.status === "CANCELLED", "Test 7: Request is CANCELLED");
    
    const balanceAfterCancel = await LeaveBalanceRepository.findByEmployeeAndType(orgA.id, empA.id, annualType.id, currentYear);
    assert(balanceAfterCancel?.usedDays === 0, "Test 7: Used days restored after cancellation");

    // ----------------------------------------------------
    // TEST 8: Payroll Contract
    // ----------------------------------------------------
    // Create and approve a request
    const req2 = await LeaveService.submitRequest(orgA.id, empA.id, annualType.id, `${currentYear}-11-01`, `${currentYear}-11-02`, 2, "Trip");
    await LeaveService.approveRequest(orgA.id, req2.id, adminA.id);

    // Create and approve an unpaid request
    const [unpaidType] = await db.insert(leaveTypes).values({
      organizationId: orgA.id,
      code: "UNPAID",
      name: "Unpaid Leave",
      isPaid: false,
      annualAllowance: 0,
      requiresApproval: true,
    }).returning();

    await LeaveBalanceRepository.create({
      organizationId: orgA.id,
      employeeId: empA.id,
      leaveTypeId: unpaidType.id,
      year: currentYear,
      allocatedDays: 10,
    });

    const req3 = await LeaveService.submitRequest(orgA.id, empA.id, unpaidType.id, `${currentYear}-11-05`, `${currentYear}-11-05`, 1, "Unpaid");
    await LeaveService.approveRequest(orgA.id, req3.id, adminA.id);

    const summaryStart = new Date(`${currentYear}-11-01T00:00:00Z`);
    const summaryEnd = new Date(`${currentYear}-11-30T23:59:59Z`);
    const summaries = await LeaveService.getBatchPayrollSummaries(orgA.id, [empA.id], summaryStart, summaryEnd);
    const summary = summaries[empA.id];
    
    assert(summary.paidLeaveDays === 2, "Test 8: Paid leave days correct in payroll summary");
    assert(summary.unpaidLeaveDays === 1, "Test 8: Unpaid leave days correct in payroll summary");
    assert(summary.approvedLeaveDays === 3, "Test 8: Total approved leave days correct in payroll summary");

    // ----------------------------------------------------
    // TEST 9: Attendance Integration `getApprovedLeaveForEmployeeDate`
    // ----------------------------------------------------
    const approvedLeaveDate = await LeaveService.getApprovedLeaveForEmployeeDate(orgA.id, empA.id, `${currentYear}-11-01`);
    assert(approvedLeaveDate?.requestId === req2.id, "Test 9: Can resolve approved leave for attendance date");

    console.log(`=== TEST SUITE COMPLETED: ${successCount}/${testCount} ASSERTS PASSED ===`);

  } catch (error) {
    console.error("=== TEST SUITE FAILED ===");
    console.error(error);
    process.exit(1);
  } finally {
    // Cleanup test data safely
    await db.delete(leaveRequests).where(eq(leaveRequests.organizationId, orgA.id));
    await db.delete(leaveBalances).where(eq(leaveBalances.organizationId, orgA.id));
    await db.delete(leaveTypes).where(eq(leaveTypes.organizationId, orgA.id));
    await db.delete(employees).where(eq(employees.organizationId, orgA.id));
    await db.delete(employees).where(eq(employees.organizationId, orgB.id));
    await db.delete(users).where(eq(users.organizationId, orgA.id));
    await db.delete(organizations).where(eq(organizations.id, orgA.id));
    await db.delete(organizations).where(eq(organizations.id, orgB.id));
    console.log("=== Cleanup completed cleanly ===");
  }
}

runTests();

