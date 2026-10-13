import { db } from "@/db";
import { PayrollPeriodRepository } from "../repository/payroll-period.repository";
import { PayrollRunRepository } from "../repository/payroll-run.repository";
import { PayrollItemRepository } from "../repository/payroll-item.repository";
import { PayslipRepository } from "../repository/payslip.repository";
import { AppError } from "@/lib/errors";
import { AuditService } from "@/modules/audit/service/audit.service";
import { PayrollEngine } from "../engine/payroll-engine";

export class PayrollService {
  /**
   * Create a new payroll period
   */
  static async createPeriod(organizationId: string, userId: string, data: { name: string; periodStart: string; periodEnd: string; }) {
    const period = await PayrollPeriodRepository.create({
      organizationId,
      createdBy: userId,
      ...data,
    });

    await AuditService.log({
      organizationId,
      userId,
      action: "PAYROLL_PERIOD_CREATED",
      entity: "payroll_periods",
      entityId: period.id,
      details: data
    });
    return period;
  }

  /**
   * Create a new payroll run for a period
   */
  static async createRun(organizationId: string, periodId: string, userId: string) {
    const period = await PayrollPeriodRepository.findById(periodId, organizationId);
    if (!period) throw new AppError("Payroll period not found", 404, "PERIOD_NOT_FOUND");

    const existingRun = await PayrollRunRepository.findByPeriodId(periodId, organizationId);
    if (existingRun) {
      if (existingRun.status !== "DRAFT" && existingRun.status !== "CANCELLED") {
        throw new AppError("An active payroll run already exists for this period", 400, "RUN_EXISTS");
      }
      return existingRun;
    }

    const run = await PayrollRunRepository.create({
      organizationId,
      payrollPeriodId: periodId,
      createdBy: userId,
    });

    await AuditService.log({
      organizationId,
      userId,
      action: "PAYROLL_RUN_CREATED",
      entity: "payroll_runs",
      entityId: run.id,
      details: { periodId }
    });
    return run;
  }

  /**
   * Calculate payroll run
   */
  static async calculateRun(organizationId: string, runId: string, userId: string) {
    return await PayrollEngine.calculateRun(organizationId, runId, userId);
  }

  /**
   * Approve a payroll run
   */
  static async approveRun(organizationId: string, runId: string, userId: string) {
    const run = await PayrollRunRepository.findById(runId, organizationId);
    if (!run) throw new AppError("Run not found", 404, "RUN_NOT_FOUND");
    if (run.status !== "REVIEW") throw new AppError("Only REVIEW runs can be approved", 400, "INVALID_STATE");

    const updated = await PayrollRunRepository.updateStatus(runId, organizationId, run.version, "APPROVED", userId);
    
    // Also approve the period
    const period = await PayrollPeriodRepository.findById(run.payrollPeriodId, organizationId);
    if (period && period.status !== "APPROVED") {
      await PayrollPeriodRepository.updateStatus(period.id, organizationId, period.version, "APPROVED", userId);
    }

    await AuditService.log({
      organizationId,
      userId,
      action: "PAYROLL_RUN_APPROVED",
      entity: "payroll_runs",
      entityId: runId,
      details: {}
    });
    return updated;
  }

  /**
   * Mark a payroll run as PAID
   */
  static async payRun(organizationId: string, runId: string, userId: string) {
    const run = await PayrollRunRepository.findById(runId, organizationId);
    if (!run) throw new AppError("Run not found", 404, "RUN_NOT_FOUND");
    if (run.status !== "APPROVED") throw new AppError("Only APPROVED runs can be marked as PAID", 400, "INVALID_STATE");

    const updated = await PayrollRunRepository.updateStatus(runId, organizationId, run.version, "PAID", userId);
    
    const period = await PayrollPeriodRepository.findById(run.payrollPeriodId, organizationId);
    if (period && period.status !== "PAID") {
      await PayrollPeriodRepository.updateStatus(period.id, organizationId, period.version, "PAID", userId);
    }

    await AuditService.log({
      organizationId,
      userId,
      action: "PAYROLL_RUN_PAID",
      entity: "payroll_runs",
      entityId: runId,
      details: {}
    });
    return updated;
  }

  /**
   * Lock a payroll run and generate payslips
   */
  static async lockRun(organizationId: string, runId: string, userId: string) {
    const run = await PayrollRunRepository.findById(runId, organizationId);
    if (!run) throw new AppError("Run not found", 404, "RUN_NOT_FOUND");
    
    if (run.status !== "PAID") {
      throw new AppError("Only PAID runs can be locked", 400, "INVALID_STATE");
    }

    const period = await PayrollPeriodRepository.findById(run.payrollPeriodId, organizationId);
    if (!period) throw new AppError("Period not found", 404, "PERIOD_NOT_FOUND");

    // 1. Mark run as LOCKED
    const updatedRun = await PayrollRunRepository.updateStatus(runId, organizationId, run.version, "LOCKED", userId);
    
    // 2. Mark period as LOCKED
    await PayrollPeriodRepository.updateStatus(period.id, organizationId, period.version, "LOCKED", userId);

    // 3. Generate Payslips
    const items = await PayrollItemRepository.findByRunId(organizationId, runId);
    
    const payslipsData = items.map((item, index) => {
      // Payslip number format: PS-YYYYMM-RUNID-INDEX
      const yearMonth = period.periodStart.replace(/-/g, "").substring(0, 6);
      const seq = (index + 1).toString().padStart(4, "0");
      const payslipNumber = `PS-${yearMonth}-${seq}`;

      // Get currency from calculation snapshot
      const snapshot = item.calculationSnapshot as unknown as { salary?: { currency: string } };
      const currency = snapshot?.salary?.currency || "USD";

      return {
        organizationId,
        payrollRunId: runId,
        employeeId: item.employeeId,
        payrollItemId: item.id,
        payslipNumber,
        periodStart: period.periodStart,
        periodEnd: period.periodEnd,
        grossPay: item.grossPay,
        totalDeductions: item.deductionAmount,
        netPay: item.netPay,
        currency,
        createdBy: userId,
      };
    });

    await PayslipRepository.insertBatch(organizationId, runId, payslipsData);

    await AuditService.log({
      organizationId,
      userId,
      action: "PAYROLL_RUN_LOCKED",
      entity: "payroll_runs",
      entityId: runId,
      details: {
        payslipsGenerated: payslipsData.length
      }
    });

    return updatedRun;
  }
}
