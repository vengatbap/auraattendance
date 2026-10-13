import { db } from "@/db";
import { LeaveRequestRepository } from "../repository/leave-request.repository";
import { LeaveBalanceRepository } from "../repository/leave-balance.repository";
import { LeaveTypeRepository } from "../repository/leave-type.repository";
import { NewLeaveRequest, LeaveRequest, LeavePayrollSummary } from "../types";
import { AuditService } from "@/modules/audit/service/audit.service";
import { eq, and, gte, lte } from "drizzle-orm";
import { leaveRequests, leaveBalances, leaveTypes } from "@/db/schema";
import { AppError } from "@/lib/errors";

export class LeaveService {
  /**
   * Submit a new leave request. Transitions state to PENDING and increments pendingDays.
   */
  static async submitRequest(
    organizationId: string,
    employeeId: string,
    leaveTypeId: string,
    startDate: string,
    endDate: string,
    requestedDays: number,
    reason: string,
    attachmentUrl?: string,
    userId?: string
  ): Promise<LeaveRequest> {
    // 1. Verify Dates
    if (startDate > endDate || requestedDays <= 0) {
      throw new AppError("Invalid leave dates or requested days.", 400, "LEAVE_DATE_INVALID");
    }

    // 2. Check for overlapping
    const overlaps = await LeaveRequestRepository.findOverlappingApproved(organizationId, employeeId, startDate, endDate);
    if (overlaps.length > 0) {
      throw new AppError("There is an overlapping pending or approved leave request.", 400, "LEAVE_OVERLAPPING_REQUEST");
    }

    // 3. Get Leave Type
    const leaveType = await LeaveTypeRepository.findById(leaveTypeId, organizationId);
    if (!leaveType) {
      throw new AppError("The specified leave type does not exist.", 404, "LEAVE_TYPE_NOT_FOUND");
    }

    const currentYear = new Date(startDate).getFullYear();

    // 4. Load Balance
    let balance = await LeaveBalanceRepository.findByEmployeeAndType(organizationId, employeeId, leaveTypeId, currentYear);
    
    if (!balance) {
      // Auto-create zero-allocated balance if missing
      balance = await LeaveBalanceRepository.create({
        organizationId,
        employeeId,
        leaveTypeId,
        year: currentYear,
        allocatedDays: 0,
        usedDays: 0,
        pendingDays: 0,
      });
    }

    // 5. Verify sufficient balance if it requires tracking and approval
    if (leaveType.requiresApproval) {
      const available = balance.allocatedDays + leaveType.maxCarryForward - balance.usedDays - balance.pendingDays;
      if (available < requestedDays) {
        throw new AppError("Insufficient leave balance.", 400, "LEAVE_INSUFFICIENT_BALANCE");
      }
    }

    // 6. Update pending balance
    const updatedBalance = await LeaveBalanceRepository.updateBalance(db as any, balance.id, balance.version, {
      pendingDays: balance.pendingDays + requestedDays
    });

    if (!updatedBalance) {
      throw new AppError("Leave balance was modified concurrently.", 409, "CONCURRENCY_CONFLICT");
    }

    // 7. Create Request
    const requestData: NewLeaveRequest = {
      organizationId,
      employeeId,
      leaveTypeId,
      startDate,
      endDate,
      requestedDays,
      reason,
      attachmentUrl,
      status: "PENDING",
      submittedAt: new Date()
    };

    const [newRequest] = await db.insert(leaveRequests).values(requestData).returning();

    // Audit Log
    await AuditService.log({
      organizationId,
      userId: userId ?? null,
      action: "LEAVE_SUBMITTED",
      entity: "leave_requests",
      entityId: newRequest.id,
      details: { requestedDays, leaveTypeId, employeeId }
    });

    return newRequest;
  }

  /**
   * Approve a leave request. Transitions state to APPROVED, decreases pendingDays, increases usedDays.
   */
  static async approveRequest(organizationId: string, requestId: string, approverId: string): Promise<LeaveRequest> {
    // 1. Verify Request
    const request = await LeaveRequestRepository.findById(requestId, organizationId);
    if (!request) throw new AppError("Leave request not found.", 404, "LEAVE_REQUEST_NOT_FOUND");
    if (request.status !== "PENDING") throw new AppError("Only PENDING requests can be approved.", 400, "LEAVE_INVALID_STATE");

    const currentYear = new Date(request.startDate).getFullYear();

    // 2. Load Balance
    const balance = await LeaveBalanceRepository.findByEmployeeAndType(organizationId, request.employeeId, request.leaveTypeId, currentYear);
    if (!balance) throw new AppError("Balance record not found.", 404, "LEAVE_BALANCE_NOT_FOUND");

    // 3. Update Balance (pending -> used)
    const updatedBalance = await LeaveBalanceRepository.updateBalance(db as any, balance.id, balance.version, {
      pendingDays: Math.max(0, balance.pendingDays - request.requestedDays),
      usedDays: balance.usedDays + request.requestedDays
    });

    if (!updatedBalance) {
      throw new AppError("Leave balance was modified concurrently.", 409, "CONCURRENCY_CONFLICT");
    }

    // 4. Update Request Status
    const updatedRequest = await LeaveRequestRepository.updateStatus(db as any, request.id, organizationId, request.version, {
      status: "APPROVED",
      approvedAt: new Date(),
      approvedBy: approverId
    });

    if (!updatedRequest) {
      throw new AppError("Leave request was modified concurrently.", 409, "CONCURRENCY_CONFLICT");
    }

    // 5. Audit Log
    await AuditService.log({
      organizationId,
      userId: approverId,
      action: "LEAVE_APPROVED",
      entity: "leave_requests",
      entityId: request.id,
      details: { requestedDays: request.requestedDays, leaveTypeId: request.leaveTypeId }
    });

    return updatedRequest;
  }

  /**
   * Reject a leave request. Transitions state to REJECTED, decreases pendingDays.
   */
  static async rejectRequest(organizationId: string, requestId: string, rejecterId: string, rejectionReason: string): Promise<LeaveRequest> {
    const request = await LeaveRequestRepository.findById(requestId, organizationId);
    if (!request) throw new AppError("Leave request not found.", 404, "LEAVE_REQUEST_NOT_FOUND");
    if (request.status !== "PENDING") throw new AppError("Only PENDING requests can be rejected.", 400, "LEAVE_INVALID_STATE");

    const currentYear = new Date(request.startDate).getFullYear();

    const balance = await LeaveBalanceRepository.findByEmployeeAndType(organizationId, request.employeeId, request.leaveTypeId, currentYear);
    if (!balance) throw new AppError("Balance record not found.", 404, "LEAVE_BALANCE_NOT_FOUND");

    const updatedBalance = await LeaveBalanceRepository.updateBalance(db as any, balance.id, balance.version, {
      pendingDays: Math.max(0, balance.pendingDays - request.requestedDays)
    });

    if (!updatedBalance) throw new AppError("Leave balance was modified concurrently.", 409, "CONCURRENCY_CONFLICT");

    const updatedRequest = await LeaveRequestRepository.updateStatus(db as any, request.id, organizationId, request.version, {
      status: "REJECTED",
      rejectedAt: new Date(),
      rejectedBy: rejecterId,
      rejectionReason
    });

    if (!updatedRequest) throw new AppError("Leave request was modified concurrently.", 409, "CONCURRENCY_CONFLICT");

    await AuditService.log({
      organizationId,
      userId: rejecterId,
      action: "LEAVE_REJECTED",
      entity: "leave_requests",
      entityId: request.id,
      details: { rejectionReason }
    });

    return updatedRequest;
  }

  /**
   * Cancel a leave request. Transitions state to CANCELLED, restores balance depending on previous state.
   */
  static async cancelRequest(organizationId: string, requestId: string, cancellerId: string): Promise<LeaveRequest> {
    const request = await LeaveRequestRepository.findById(requestId, organizationId);
    if (!request) throw new AppError("Leave request not found.", 404, "LEAVE_REQUEST_NOT_FOUND");
    if (request.status !== "PENDING" && request.status !== "APPROVED") {
      throw new AppError("Only PENDING or APPROVED requests can be cancelled.", 400, "LEAVE_INVALID_STATE");
    }

    const currentYear = new Date(request.startDate).getFullYear();
    const balance = await LeaveBalanceRepository.findByEmployeeAndType(organizationId, request.employeeId, request.leaveTypeId, currentYear);
    if (!balance) throw new AppError("Balance record not found.", 404, "LEAVE_BALANCE_NOT_FOUND");

    let newPendingDays = balance.pendingDays;
    let newUsedDays = balance.usedDays;

    if (request.status === "PENDING") {
      newPendingDays = Math.max(0, balance.pendingDays - request.requestedDays);
    } else if (request.status === "APPROVED") {
      newUsedDays = Math.max(0, balance.usedDays - request.requestedDays);
    }

    const updatedBalance = await LeaveBalanceRepository.updateBalance(db as any, balance.id, balance.version, {
      pendingDays: newPendingDays,
      usedDays: newUsedDays
    });

    if (!updatedBalance) throw new AppError("Leave balance was modified concurrently.", 409, "CONCURRENCY_CONFLICT");

    const updatedRequest = await LeaveRequestRepository.updateStatus(db as any, request.id, organizationId, request.version, {
      status: "CANCELLED"
    });

    if (!updatedRequest) throw new AppError("Leave request was modified concurrently.", 409, "CONCURRENCY_CONFLICT");

    await AuditService.log({
      organizationId,
      userId: cancellerId,
      action: "LEAVE_CANCELLED",
      entity: "leave_requests",
      entityId: request.id,
      details: { previousStatus: request.status }
    });

    return updatedRequest;
  }

  /**
   * Get batch payroll summaries for multiple employees in a given period.
   */
  
  static async getPayrollSummary(
    organizationId: string,
    employeeId: string,
    periodStart: Date,
    periodEnd: Date
  ): Promise<LeavePayrollSummary> {
    const batch = await this.getBatchPayrollSummaries(organizationId, [employeeId], periodStart, periodEnd);
    return batch[employeeId];
  }

  static async getBatchPayrollSummaries(
    organizationId: string,
    employeeIds: string[],
    periodStart: Date,
    periodEnd: Date
  ): Promise<Record<string, LeavePayrollSummary>> {
    const startStr = periodStart.toISOString().split("T")[0];
    const endStr = periodEnd.toISOString().split("T")[0];

    const approvedRequests = await db
      .select({
        request: leaveRequests,
        type: leaveTypes
      })
      .from(leaveRequests)
      .innerJoin(leaveTypes, eq(leaveRequests.leaveTypeId, leaveTypes.id))
      .where(
        and(
          eq(leaveRequests.organizationId, organizationId),
          eq(leaveRequests.status, "APPROVED"),
          lte(leaveRequests.startDate, endStr),
          gte(leaveRequests.endDate, startStr)
        )
      );

    const requestedSet = new Set(employeeIds);
    const relevantRequests = approvedRequests.filter(r => requestedSet.has(r.request.employeeId));

    const summaries: Record<string, LeavePayrollSummary> = {};
    for (const empId of employeeIds) {
      summaries[empId] = {
        employeeId: empId,
        periodStart,
        periodEnd,
        paidLeaveDays: 0,
        unpaidLeaveDays: 0,
        approvedLeaveDays: 0
      };
    }

    for (const req of relevantRequests) {
      const empId = req.request.employeeId;
      const summary = summaries[empId];

      const reqStart = new Date(req.request.startDate);
      const reqEnd = new Date(req.request.endDate);
      
      const overlapStart = reqStart < periodStart ? periodStart : reqStart;
      const overlapEnd = reqEnd > periodEnd ? periodEnd : reqEnd;
      
      if (overlapStart <= overlapEnd) {
        const msPerDay = 1000 * 60 * 60 * 24;
        const days = Math.round((overlapEnd.getTime() - overlapStart.getTime()) / msPerDay) + 1;
        
        summary.approvedLeaveDays += days;
        if (req.type.isPaid) {
          summary.paidLeaveDays += days;
        } else {
          summary.unpaidLeaveDays += days;
        }
      }
    }

    return summaries;
  }

  /**
   * Get payroll summary for an employee in a given period.
    organizationId: string,
    employeeId: string,
    periodStart: Date,
    periodEnd: Date
  ): Promise<LeavePayrollSummary> {
    const startStr = periodStart.toISOString().split("T")[0];
    const endStr = periodEnd.toISOString().split("T")[0];

    const approvedRequests = await db
      .select({
        request: leaveRequests,
        type: leaveTypes
      })
      .from(leaveRequests)
      .innerJoin(leaveTypes, eq(leaveRequests.leaveTypeId, leaveTypes.id))
      .where(
        and(
          eq(leaveRequests.organizationId, organizationId),
          eq(leaveRequests.employeeId, employeeId),
          eq(leaveRequests.status, "APPROVED"),
          lte(leaveRequests.startDate, endStr),
          gte(leaveRequests.endDate, startStr)
        )
      );

    let paidLeaveDays = 0;
    let unpaidLeaveDays = 0;
    let approvedLeaveDays = 0;

    for (const req of approvedRequests) {
      // In a real implementation we would calculate exact overlapping days between request and period.
      // For V1, assuming requests don't span multiple months mostly, or we use full request days 
      // if it falls in the period.
      // Let's do a strict overlap calculation.
      const reqStart = new Date(req.request.startDate);
      const reqEnd = new Date(req.request.endDate);
      
      const overlapStart = reqStart < periodStart ? periodStart : reqStart;
      const overlapEnd = reqEnd > periodEnd ? periodEnd : reqEnd;
      
      if (overlapStart <= overlapEnd) {
        // Calculate days (inclusive)
        const msPerDay = 1000 * 60 * 60 * 24;
        const days = Math.round((overlapEnd.getTime() - overlapStart.getTime()) / msPerDay) + 1;
        
        approvedLeaveDays += days;
        if (req.type.isPaid) {
          paidLeaveDays += days;
        } else {
          unpaidLeaveDays += days;
        }
      }
    }

    return {
      employeeId,
      periodStart,
      periodEnd,
      paidLeaveDays,
      unpaidLeaveDays,
      approvedLeaveDays
    };
  }

  /**
   * Get approved leave for an employee on a specific date.
   * Used by Attendance Engine to determine if an absence is excused.
   */
  static async getApprovedLeaveForEmployeeDate(
    organizationId: string,
    employeeId: string,
    dateStr: string
  ) {
    const [request] = await db
      .select({
        leaveType: leaveTypes.name,
        isPaid: leaveTypes.isPaid,
        days: leaveRequests.requestedDays,
        requestId: leaveRequests.id,
        status: leaveRequests.status
      })
      .from(leaveRequests)
      .innerJoin(leaveTypes, eq(leaveRequests.leaveTypeId, leaveTypes.id))
      .where(
        and(
          eq(leaveRequests.organizationId, organizationId),
          eq(leaveRequests.employeeId, employeeId),
          eq(leaveRequests.status, "APPROVED"),
          lte(leaveRequests.startDate, dateStr),
          gte(leaveRequests.endDate, dateStr)
        )
      )
      .limit(1);

    return request || null;
  }
}

