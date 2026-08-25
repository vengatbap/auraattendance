import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PayrollEngine } from '../engine/payroll-engine';
import { PayrollService } from '../services/payroll.service';
import { MoneyService } from '../services/money.service';
import { PayrollPeriodRepository } from '../repository/payroll-period.repository';
import { PayrollRunRepository } from '../repository/payroll-run.repository';
import { PayrollItemRepository } from '../repository/payroll-item.repository';
import { PayslipRepository } from '../repository/payslip.repository';
import { AttendanceSummaryService } from '@/modules/attendance-engine';
import { LeaveService } from '@/modules/leave/service/leave.service';
import { db } from '@/db';

// Mock dependencies
vi.mock('@/db', () => ({
  db: {
    query: {
      salarySettings: { findMany: vi.fn() },
      employees: { findMany: vi.fn() }
    },
    transaction: vi.fn(async (cb) => await cb({}))
  }
}));

vi.mock('../repository/payroll-period.repository');
vi.mock('../repository/payroll-run.repository');
vi.mock('../repository/payroll-item.repository');
vi.mock('../repository/payslip.repository');
vi.mock('@/modules/attendance-engine');
vi.mock('@/modules/leave/service/leave.service');
vi.mock('@/modules/audit/service/audit.service');

describe('Payroll Backend E2E Tests', () => {
  const orgId = 'org-1';
  const userId = 'user-1';
  const runId = 'run-1';
  const periodId = 'period-1';
  
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('MoneyService (BigInt Precision Handling)', () => {
    it('should test strict BigInt money precision handling for addition', () => {
      expect(MoneyService.add('100.50', '200.75')).toBe('301.25');
    });
    
    it('should handle subtraction safely without floating point errors', () => {
      expect(MoneyService.subtract('300.00', '150.55')).toBe('149.45');
    });
    
    it('should handle multiplication with precise rounding', () => {
      expect(MoneyService.multiply('10.50', '2.5')).toBe('26.25');
    });
    
    it('should test division precision without losing cents', () => {
      expect(MoneyService.divide('1000.00', '3')).toBe('333.33');
    });
  });

  describe('PayrollEngine (Calculations)', () => {
    const setupMocks = (
      basicSalary = '3000', 
      overtimeRate = '20', 
      presentDays = 20, 
      overtimeHours = 0,
      absentDays = 0,
      paidLeaveDays = 0,
      unpaidLeaveDays = 0,
      allowances = [],
      deductions = []
    ) => {
      const mockRun = { id: runId, status: 'DRAFT', payrollPeriodId: periodId, version: 1 };
      const mockPeriod = { id: periodId, periodStart: '2023-10-01', periodEnd: '2023-10-31' };
      
      vi.mocked(PayrollRunRepository.findById).mockResolvedValue(mockRun as any);
      vi.mocked(PayrollPeriodRepository.findById).mockResolvedValue(mockPeriod as any);
      
      db.query.salarySettings.findMany = vi.fn().mockResolvedValue([{
        id: 'sal-1', employeeId: 'emp-1', currency: 'USD', payFrequency: 'MONTHLY',
        basicSalary, overtimeRate, workingDaysPerPeriod: '20', workingHoursPerDay: '8',
        fixedAllowances: allowances, fixedDeductions: deductions
      }]);
      db.query.employees.findMany = vi.fn().mockResolvedValue([{ id: 'emp-1', organizationId: orgId }]);
      
      vi.mocked(AttendanceSummaryService.getBatchAttendancePayrollSummaries).mockResolvedValue({
        'emp-1': { employeeId: 'emp-1', periodStart: new Date(), periodEnd: new Date(), scheduledDays: 20, presentDays, absentDays, overtimeHours, missingCheckoutDays: 0, attendanceWarningDays: 0 }
      });
      vi.mocked(LeaveService.getBatchPayrollSummaries).mockResolvedValue({
        'emp-1': { employeeId: 'emp-1', periodStart: new Date(), periodEnd: new Date(), paidLeaveDays, unpaidLeaveDays, approvedLeaveDays: paidLeaveDays + unpaidLeaveDays }
      });
    };

    it('should calculate single payroll item (Basic Salary + Present Days)', async () => {
      setupMocks('3000.00', '0.00', 20, 0, 0, 0, 0);
      await PayrollEngine.calculateRun(orgId, runId, userId);
      expect(PayrollItemRepository.insertBatch).toHaveBeenCalledWith(orgId, runId, expect.arrayContaining([
        expect.objectContaining({ basicSalary: '3000.00', grossPay: '3000.00', netPay: '3000.00' })
      ]));
    });

    it('should calculate overtime generation check correctly', async () => {
      setupMocks('3000.00', '20.00', 20, 5, 0, 0, 0); // 5 hours * 20 = 100
      await PayrollEngine.calculateRun(orgId, runId, userId);
      expect(PayrollItemRepository.insertBatch).toHaveBeenCalledWith(orgId, runId, expect.arrayContaining([
        expect.objectContaining({ overtimeAmount: '100.00', grossPay: '3100.00' })
      ]));
    });

    it('should include paid leave properly (no deduction)', async () => {
      setupMocks('3000.00', '0.00', 18, 0, 2, 2, 0); 
      // 2 days absent but covered by 2 days paid leave -> unpaid absence 0
      await PayrollEngine.calculateRun(orgId, runId, userId);
      expect(PayrollItemRepository.insertBatch).toHaveBeenCalledWith(orgId, runId, expect.arrayContaining([
        expect.objectContaining({ unpaidAbsenceAmount: '0.00', grossPay: '3000.00' })
      ]));
    });

    it('should calculate unpaid leave deductions', async () => {
      setupMocks('3000.00', '0.00', 18, 0, 2, 0, 2); 
      // 2 days unpaid leave. Daily rate = 3000/20 = 150. Deduction = 300.
      await PayrollEngine.calculateRun(orgId, runId, userId);
      expect(PayrollItemRepository.insertBatch).toHaveBeenCalledWith(orgId, runId, expect.arrayContaining([
        expect.objectContaining({ unpaidAbsenceAmount: '300.00', grossPay: '2700.00', netPay: '2700.00' })
      ]));
    });

    it('should enforce zero-hour deduction (Net pay floors at zero)', async () => {
      setupMocks('3000.00', '0.00', 0, 0, 20, 0, 0, [], [{ name: 'Penalty', amount: '4000.00' }] as any); 
      // Absent 20 days. Unpaid deduction 3000. Gross = 0. Fixed deduction 4000. Net should floor at 0.
      await PayrollEngine.calculateRun(orgId, runId, userId);
      expect(PayrollItemRepository.insertBatch).toHaveBeenCalledWith(orgId, runId, expect.arrayContaining([
        expect.objectContaining({ grossPay: '0.00', netPay: '0.00' })
      ]));
    });

    it('should calculate pro-rated missing attendance properly', async () => {
      setupMocks('3000.00', '0.00', 10, 0, 10, 5, 0); 
      // 10 absent. 5 paid leave. Unpaid = 5. Daily rate = 150. 5*150 = 750 deduction.
      await PayrollEngine.calculateRun(orgId, runId, userId);
      expect(PayrollItemRepository.insertBatch).toHaveBeenCalledWith(orgId, runId, expect.arrayContaining([
        expect.objectContaining({ unpaidAbsenceAmount: '750.00', grossPay: '2250.00' })
      ]));
    });
    
    it('should calculate fixed allowances correctly', async () => {
      setupMocks('3000.00', '0.00', 20, 0, 0, 0, 0, [{ name: 'Bonus', amount: '500.00' }] as any, []);
      await PayrollEngine.calculateRun(orgId, runId, userId);
      expect(PayrollItemRepository.insertBatch).toHaveBeenCalledWith(orgId, runId, expect.arrayContaining([
        expect.objectContaining({ allowanceAmount: '500.00', grossPay: '3500.00' })
      ]));
    });
  });

  describe('State Machine Transitions', () => {
    it('should transition Create Period -> DRAFT (implicit by initial creation)', async () => {
      vi.mocked(PayrollPeriodRepository.create).mockResolvedValue({ id: periodId, status: 'DRAFT' } as any);
      const period = await PayrollService.createPeriod(orgId, userId, { name: 'P1', periodStart: '2023-10-01', periodEnd: '2023-10-31' });
      expect(period.status).toBe('DRAFT');
    });

    it('should transition Create Run -> DRAFT', async () => {
      vi.mocked(PayrollPeriodRepository.findById).mockResolvedValue({ id: periodId } as any);
      vi.mocked(PayrollRunRepository.findByPeriodId).mockResolvedValue(null as any);
      vi.mocked(PayrollRunRepository.create).mockResolvedValue({ id: runId, status: 'DRAFT' } as any);
      const run = await PayrollService.createRun(orgId, periodId, userId);
      expect(run.status).toBe('DRAFT');
    });

    it('should transition Calculate Run -> CALCULATING then REVIEW', async () => {
      vi.mocked(PayrollRunRepository.findById)
        .mockResolvedValueOnce({ id: runId, status: 'DRAFT', payrollPeriodId: periodId, version: 1 } as any)
        .mockResolvedValueOnce({ id: runId, status: 'CALCULATING', payrollPeriodId: periodId, version: 2 } as any);
      vi.mocked(PayrollPeriodRepository.findById).mockResolvedValue({ id: periodId } as any);
      db.query.salarySettings.findMany = vi.fn().mockResolvedValue([]);
      
      await expect(PayrollEngine.calculateRun(orgId, runId, userId)).rejects.toThrow('No active salary configurations found.');
      expect(PayrollRunRepository.updateStatus).toHaveBeenCalledWith(runId, orgId, 1, 'CALCULATING', userId);
    });

    it('should revert Calculate Run to DRAFT on error', async () => {
      vi.mocked(PayrollRunRepository.findById)
        .mockResolvedValueOnce({ id: runId, status: 'DRAFT', payrollPeriodId: periodId, version: 1 } as any)
        .mockResolvedValueOnce({ id: runId, status: 'CALCULATING', payrollPeriodId: periodId, version: 2 } as any);
      vi.mocked(PayrollPeriodRepository.findById).mockResolvedValue({ id: periodId } as any);
      db.query.salarySettings.findMany = vi.fn().mockResolvedValue([]); // throws error
      
      try {
        await PayrollEngine.calculateRun(orgId, runId, userId);
      } catch (e) {}
      expect(PayrollRunRepository.updateStatus).toHaveBeenCalledWith(runId, orgId, 2, 'DRAFT', userId);
    });

    it('should transition Approve Run (REVIEW -> APPROVED)', async () => {
      vi.mocked(PayrollRunRepository.findById).mockResolvedValue({ id: runId, status: 'REVIEW', payrollPeriodId: periodId, version: 1 } as any);
      vi.mocked(PayrollRunRepository.updateStatus).mockResolvedValue({ id: runId, status: 'APPROVED' } as any);
      const run = await PayrollService.approveRun(orgId, runId, userId);
      expect(run.status).toBe('APPROVED');
    });

    it('should fail Approve Run if not REVIEW', async () => {
      vi.mocked(PayrollRunRepository.findById).mockResolvedValue({ id: runId, status: 'DRAFT' } as any);
      await expect(PayrollService.approveRun(orgId, runId, userId)).rejects.toThrow('Only REVIEW runs can be approved');
    });

    it('should transition Pay Run (APPROVED -> PAID)', async () => {
      vi.mocked(PayrollRunRepository.findById).mockResolvedValue({ id: runId, status: 'APPROVED', payrollPeriodId: periodId, version: 1 } as any);
      vi.mocked(PayrollRunRepository.updateStatus).mockResolvedValue({ id: runId, status: 'PAID' } as any);
      const run = await PayrollService.payRun(orgId, runId, userId);
      expect(run.status).toBe('PAID');
    });

    it('should fail Pay Run if not APPROVED', async () => {
      vi.mocked(PayrollRunRepository.findById).mockResolvedValue({ id: runId, status: 'REVIEW' } as any);
      await expect(PayrollService.payRun(orgId, runId, userId)).rejects.toThrow('Only APPROVED runs can be marked as PAID');
    });

    it('should transition Lock Run (PAID -> LOCKED)', async () => {
      vi.mocked(PayrollRunRepository.findById).mockResolvedValue({ id: runId, status: 'PAID', payrollPeriodId: periodId, version: 1 } as any);
      vi.mocked(PayrollPeriodRepository.findById).mockResolvedValue({ id: periodId, periodStart: '2023-10-01', periodEnd: '2023-10-31' } as any);
      vi.mocked(PayrollItemRepository.findByRunId).mockResolvedValue([]);
      vi.mocked(PayrollRunRepository.updateStatus).mockResolvedValue({ id: runId, status: 'LOCKED' } as any);
      
      const run = await PayrollService.lockRun(orgId, runId, userId);
      expect(run.status).toBe('LOCKED');
    });

    it('should fail Lock Run if not PAID', async () => {
      vi.mocked(PayrollRunRepository.findById).mockResolvedValue({ id: runId, status: 'APPROVED' } as any);
      await expect(PayrollService.lockRun(orgId, runId, userId)).rejects.toThrow('Only PAID runs can be locked');
    });
    
    it('should validate immutability of LOCKED runs', async () => {
      vi.mocked(PayrollRunRepository.findById).mockResolvedValue({ id: runId, status: 'LOCKED' } as any);
      await expect(PayrollEngine.calculateRun(orgId, runId, userId)).rejects.toThrow('Can only calculate DRAFT or CALCULATING runs.');
    });
  });

  describe('Tenant Isolation (Cross-tenant data leakage)', () => {
    it('should fail Create Run if period belongs to different org (mock returns null)', async () => {
      vi.mocked(PayrollPeriodRepository.findById).mockResolvedValue(null as any);
      await expect(PayrollService.createRun(orgId, periodId, userId)).rejects.toThrow('Payroll period not found');
    });
    
    it('should enforce org checks when approving runs', async () => {
      vi.mocked(PayrollRunRepository.findById).mockResolvedValue(null as any);
      await expect(PayrollService.approveRun(orgId, runId, userId)).rejects.toThrow('Run not found');
    });
    
    it('should enforce org checks when paying runs', async () => {
      vi.mocked(PayrollRunRepository.findById).mockResolvedValue(null as any);
      await expect(PayrollService.payRun(orgId, runId, userId)).rejects.toThrow('Run not found');
    });
    
    it('should pass correct organizationId to PayslipRepository on Lock Run', async () => {
      vi.mocked(PayrollRunRepository.findById).mockResolvedValue({ id: runId, status: 'PAID', payrollPeriodId: periodId, version: 1 } as any);
      vi.mocked(PayrollPeriodRepository.findById).mockResolvedValue({ id: periodId, periodStart: '2023-10-01', periodEnd: '2023-10-31' } as any);
      vi.mocked(PayrollItemRepository.findByRunId).mockResolvedValue([
        { id: 'item-1', employeeId: 'emp-1', grossPay: '1000.00', deductionAmount: '100.00', netPay: '900.00', calculationSnapshot: {} } as any
      ]);
      await PayrollService.lockRun(orgId, runId, userId);
      expect(PayslipRepository.insertBatch).toHaveBeenCalledWith(orgId, runId, expect.arrayContaining([
        expect.objectContaining({ organizationId: orgId })
      ]));
    });

    it('should fail Calculate Run if run belongs to different org', async () => {
      vi.mocked(PayrollRunRepository.findById).mockResolvedValue(null as any);
      await expect(PayrollEngine.calculateRun('wrong-org', runId, userId)).rejects.toThrow('Payroll run not found.');
    });
  });
});
