import { db } from "@/db";
import { SalaryRepository } from "../repository/salary.repository";
import { PayrollRunRepository } from "../repository/payroll-run.repository";
import { PayrollPeriodRepository } from "../repository/payroll-period.repository";
import { PayrollItemRepository } from "../repository/payroll-item.repository";
import { MoneyService } from "../services/money.service";
import { AttendanceSummaryService } from "@/modules/attendance-engine";
import { LeaveService } from "@/modules/leave/service/leave.service";
import { AppError } from "@/lib/errors";
import { PayrollCalculationContext, Allowance, Deduction } from "../types";

export class PayrollEngine {
  /**
   * Calculates a payroll run. 
   * Idempotent per run. Overwrites existing DRAFT calculations for the run.
   */
  static async calculateRun(organizationId: string, runId: string, userId: string) {
    const run = await PayrollRunRepository.findById(runId, organizationId);
    if (!run) throw new AppError("Payroll run not found.", 404, "RUN_NOT_FOUND");
    if (run.status !== "DRAFT" && run.status !== "CALCULATING") {
      throw new AppError("Can only calculate DRAFT or CALCULATING runs.", 400, "INVALID_RUN_STATE");
    }

    const period = await PayrollPeriodRepository.findById(run.payrollPeriodId, organizationId);
    if (!period) throw new AppError("Payroll period not found.", 404, "PERIOD_NOT_FOUND");

    // Mark as calculating
    await PayrollRunRepository.updateStatus(runId, organizationId, run.version, "CALCULATING", userId);

    try {
      // 1. Fetch all salaries for organization
      // In a real system, we might only fetch active employees for the period
      const allSalaries = await db.query.salarySettings.findMany({
        where: (s, { eq, and }) => and(
          eq(s.organizationId, organizationId),
          eq(s.status, "ACTIVE")
        )
      });

      if (allSalaries.length === 0) {
        throw new AppError("No active salary configurations found.", 400, "NO_EMPLOYEES");
      }

      // 2. Fetch all employees to get valid ones
      const employees = await db.query.employees.findMany({
        where: (e, { eq, and, isNull }) => and(
          eq(e.organizationId, organizationId),
          isNull(e.deletedAt)
        )
      });
      const validEmployeeIds = new Set(employees.map(e => e.id));
      const salaries = allSalaries.filter(s => validEmployeeIds.has(s.employeeId));

      const periodStartStr = period.periodStart;
      const periodEndStr = period.periodEnd;
      const periodStartDate = new Date(periodStartStr);
      const periodEndDate = new Date(periodEndStr);

      // We avoid N+1 by fetching everything we can. 
      // Attendance summary service currently queries per employee, but since it's just 
      // aggregating logs, we can batch it or just use Promise.all with chunks.
      // The CTO approved `Promise.all` in chunks of 50.

      const CHUNK_SIZE = 50;
      const contexts: PayrollCalculationContext[] = [];

      for (let i = 0; i < salaries.length; i += CHUNK_SIZE) {
        const chunk = salaries.slice(i, i + CHUNK_SIZE);
        const chunkIds = chunk.map(s => s.employeeId);

        const [attendanceSummaries, leaveSummaries] = await Promise.all([
          AttendanceSummaryService.getBatchAttendancePayrollSummaries(
            organizationId,
            chunkIds,
            periodStartStr,
            periodEndStr
          ),
          LeaveService.getBatchPayrollSummaries(
            organizationId,
            chunkIds,
            periodStartDate,
            periodEndDate
          )
        ]);

        const chunkPromises = chunk.map(async (salary) => {
          const attendance = attendanceSummaries[salary.employeeId];
          const leave = leaveSummaries[salary.employeeId];

          // Context assembly
          const ctx: PayrollCalculationContext = {
            organizationId,
            employeeId: salary.employeeId,
            periodStart: periodStartDate,
            periodEnd: periodEndDate,
            salary: {
              id: salary.id,
              currency: salary.currency,
              payFrequency: salary.payFrequency,
              basicSalary: salary.basicSalary,
              overtimeRate: salary.overtimeRate,
              workingDaysPerPeriod: salary.workingDaysPerPeriod,
              workingHoursPerDay: salary.workingHoursPerDay,
              fixedAllowances: (salary.fixedAllowances as unknown) as Allowance[],
              fixedDeductions: (salary.fixedDeductions as unknown) as Deduction[],
            },
            attendance,
            leave,
            overtimeHours: attendance.overtimeHours.toString(),
            overtimeAmount: "0",
            allowanceAmount: "0",
            deductionAmount: "0",
            unpaidAbsenceAmount: "0",
            grossPay: "0",
            netPay: "0",
            calculationSnapshot: {} as PayrollCalculationContext["calculationSnapshot"]
          };

          this.executeCalculationPipeline(ctx);
          return ctx;
        });

        const chunkResults = await Promise.all(chunkPromises);
        contexts.push(...chunkResults);
      }

      // Prepare items for batch insert
      const itemsToInsert = contexts.map(ctx => ({
        organizationId, 
        payrollRunId: runId, 
        employeeId: ctx.employeeId,
        salarySettingId: ctx.salary.id,
        basicSalary: ctx.salary.basicSalary,
        presentDays: ctx.attendance.presentDays.toString(),
        paidLeaveDays: ctx.leave.paidLeaveDays.toString(),
        unpaidLeaveDays: ctx.leave.unpaidLeaveDays.toString(),
        absentDays: ctx.attendance.absentDays.toString(),
        overtimeHours: ctx.overtimeHours,
        overtimeAmount: ctx.overtimeAmount,
        allowanceAmount: ctx.allowanceAmount,
        deductionAmount: ctx.deductionAmount,
        unpaidAbsenceAmount: ctx.unpaidAbsenceAmount,
        grossPay: ctx.grossPay,
        netPay: ctx.netPay,
        calculationSnapshot: ctx.calculationSnapshot,
        createdBy: userId,
      }));

      // Clear old items and insert new ones
      await PayrollItemRepository.deleteByRunId(organizationId, runId);
      await PayrollItemRepository.insertBatch(organizationId, runId, itemsToInsert);

      // Aggregate totals
      let totalGross = "0";
      let totalDeductions = "0";
      let totalNet = "0";

      for (const ctx of contexts) {
        totalGross = MoneyService.add(totalGross, ctx.grossPay);
        totalDeductions = MoneyService.add(totalDeductions, ctx.deductionAmount);
        totalDeductions = MoneyService.add(totalDeductions, ctx.unpaidAbsenceAmount);
        totalNet = MoneyService.add(totalNet, ctx.netPay);
      }

      // Transition run back to DRAFT but with totals
      const runAfterCalc = await PayrollRunRepository.findById(runId, organizationId);
      if (runAfterCalc) {
        await PayrollRunRepository.updateTotals(runId, organizationId, {
          employeeCount: contexts.length,
          grossTotal: totalGross,
          deductionTotal: totalDeductions,
          netTotal: totalNet,
          updatedBy: userId,
        });

        // Set status to REVIEW (which means calculation done, ready for review)
        return await PayrollRunRepository.updateStatus(runId, organizationId, runAfterCalc.version, "REVIEW", userId);
      }

      return await PayrollRunRepository.findById(runId, organizationId);
    } catch (error) {
      // Revert status to DRAFT on error if it was calculating
      const currentRun = await PayrollRunRepository.findById(runId, organizationId);
      if (currentRun && currentRun.status === "CALCULATING") {
        await PayrollRunRepository.updateStatus(runId, organizationId, currentRun.version, "DRAFT", userId);
      }
      throw error;
    }
  }

  private static executeCalculationPipeline(ctx: PayrollCalculationContext) {
    // 1. Calculate Daily Rate
    const dailyRate = MoneyService.divide(ctx.salary.basicSalary, ctx.salary.workingDaysPerPeriod);

    // 2. Unpaid Absences = Absent Days - Paid Leave
    const unpaidDays = Math.max(0, ctx.attendance.absentDays - ctx.leave.paidLeaveDays);
    
    if (unpaidDays > 0) {
      ctx.unpaidAbsenceAmount = MoneyService.multiply(dailyRate, unpaidDays);
    } else {
      ctx.unpaidAbsenceAmount = "0.00";
    }

    // 3. Overtime
    if (MoneyService.isGreaterThanZero(ctx.overtimeHours) && MoneyService.isGreaterThanZero(ctx.salary.overtimeRate)) {
      ctx.overtimeAmount = MoneyService.multiply(ctx.salary.overtimeRate, ctx.overtimeHours);
    } else {
      ctx.overtimeAmount = "0.00";
    }

    // 4. Fixed Allowances
    let totalAllowances = "0.00";
    for (const allowance of ctx.salary.fixedAllowances) {
      totalAllowances = MoneyService.add(totalAllowances, allowance.amount);
    }
    ctx.allowanceAmount = totalAllowances;

    // 5. Fixed Deductions
    let totalDeductions = "0.00";
    for (const deduction of ctx.salary.fixedDeductions) {
      totalDeductions = MoneyService.add(totalDeductions, deduction.amount);
    }
    ctx.deductionAmount = totalDeductions;

    // 6. Gross Pay = Basic + Allowances + Overtime - Unpaid Absences
    let gross = MoneyService.add(ctx.salary.basicSalary, ctx.allowanceAmount);
    gross = MoneyService.add(gross, ctx.overtimeAmount);
    gross = MoneyService.subtract(gross, ctx.unpaidAbsenceAmount);
    // Floor gross at 0
    if (gross.startsWith("-")) gross = "0.00";
    ctx.grossPay = gross;

    // 7. Net Pay = Gross - Deductions
    let net = MoneyService.subtract(ctx.grossPay, ctx.deductionAmount);
    if (net.startsWith("-")) net = "0.00"; // Floor net at 0
    ctx.netPay = net;

    // 8. Snapshot creation
    ctx.calculationSnapshot = {
      salary: ctx.salary,
      attendance: ctx.attendance,
      leave: ctx.leave,
      calculations: {
        basicSalary: ctx.salary.basicSalary,
        presentDays: ctx.attendance.presentDays.toString(),
        paidLeaveDays: ctx.leave.paidLeaveDays.toString(),
        unpaidLeaveDays: ctx.leave.unpaidLeaveDays.toString(),
        absentDays: ctx.attendance.absentDays.toString(),
        overtimeHours: ctx.overtimeHours,
        overtimeAmount: ctx.overtimeAmount,
        allowanceAmount: ctx.allowanceAmount,
        deductionAmount: ctx.deductionAmount,
        unpaidAbsenceAmount: ctx.unpaidAbsenceAmount,
        grossPay: ctx.grossPay,
        netPay: ctx.netPay,
      }
    };
  }
}
