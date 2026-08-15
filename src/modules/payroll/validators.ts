import { z } from "zod";

export const allowanceSchema = z.object({
  name: z.string().min(1, "Allowance name is required").max(100),
  amount: z.string().regex(/^\d+(\.\d{1,2})?$/, "Amount must be a valid decimal number"),
  taxable: z.boolean().optional(),
});

export const deductionSchema = z.object({
  name: z.string().min(1, "Deduction name is required").max(100),
  amount: z.string().regex(/^\d+(\.\d{1,2})?$/, "Amount must be a valid decimal number"),
  taxable: z.boolean().optional(),
});

export const salarySettingInsertSchema = z.object({
  employeeId: z.string().uuid(),
  currency: z.string().length(3).toUpperCase(),
  payFrequency: z.string().min(1),
  basicSalary: z.string().regex(/^\d+(\.\d{1,2})?$/, "Amount must be a valid decimal number"),
  overtimeRate: z.string().regex(/^\d+(\.\d{1,2})?$/, "Amount must be a valid decimal number").default("0"),
  workingDaysPerPeriod: z.string().regex(/^\d+(\.\d{1,2})?$/, "Must be a valid decimal").default("22"),
  workingHoursPerDay: z.string().regex(/^\d+(\.\d{1,2})?$/, "Must be a valid decimal").default("8"),
  fixedAllowances: z.array(allowanceSchema).default([]),
  fixedDeductions: z.array(deductionSchema).default([]),
  effectiveFrom: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Format YYYY-MM-DD"),
  effectiveTo: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Format YYYY-MM-DD").optional().nullable(),
});

export const payrollPeriodInsertSchema = z.object({
  name: z.string().min(1).max(255),
  periodStart: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Format YYYY-MM-DD"),
  periodEnd: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Format YYYY-MM-DD"),
});
