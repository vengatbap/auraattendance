export type PayrollPeriodStatus = "DRAFT" | "CALCULATING" | "REVIEW" | "APPROVED" | "PAID" | "LOCKED" | "CANCELLED";
export type PayrollRunStatus = "DRAFT" | "CALCULATING" | "REVIEW" | "APPROVED" | "PAID" | "LOCKED" | "CANCELLED";
export type PayslipStatus = "LOCKED";

export interface Allowance {
  name: string;
  amount: string; // Stored as string to maintain exact decimal representation
  taxable?: boolean;
}

export interface Deduction {
  name: string;
  amount: string; // Stored as string to maintain exact decimal representation
  taxable?: boolean;
}

export interface AttendancePayrollSummary {
  employeeId: string;
  periodStart: Date;
  periodEnd: Date;
  scheduledDays: number;
  presentDays: number;
  absentDays: number;
  overtimeHours: number;
  missingCheckoutDays: number;
  attendanceWarningDays: number;
}

export interface LeavePayrollSummary {
  employeeId: string;
  periodStart: Date;
  periodEnd: Date;
  paidLeaveDays: number;
  unpaidLeaveDays: number;
  approvedLeaveDays: number;
}

export interface SalarySnapshot {
  id: string;
  currency: string;
  payFrequency: string;
  basicSalary: string;
  overtimeRate: string;
  workingDaysPerPeriod: string;
  workingHoursPerDay: string;
  fixedAllowances: Allowance[];
  fixedDeductions: Deduction[];
}

export interface PayrollCalculationContext {
  organizationId: string;
  employeeId: string;
  periodStart: Date;
  periodEnd: Date;
  salary: SalarySnapshot;
  attendance: AttendancePayrollSummary;
  leave: LeavePayrollSummary;
  
  // Accumulated components
  overtimeHours: string;
  overtimeAmount: string;
  allowanceAmount: string;
  deductionAmount: string;
  unpaidAbsenceAmount: string;

  grossPay: string;
  netPay: string;

  // Final deterministic snapshot payload
  calculationSnapshot: {
    salary: SalarySnapshot;
    attendance: AttendancePayrollSummary;
    leave: LeavePayrollSummary;
    calculations: {
      basicSalary: string;
      presentDays: string;
      paidLeaveDays: string;
      unpaidLeaveDays: string;
      absentDays: string;
      overtimeHours: string;
      overtimeAmount: string;
      allowanceAmount: string;
      deductionAmount: string;
      unpaidAbsenceAmount: string;
      grossPay: string;
      netPay: string;
    };
  };
}
