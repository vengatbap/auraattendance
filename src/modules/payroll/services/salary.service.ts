import { AuditService } from "@/modules/audit/service/audit.service";
import { SalaryRepository } from "../repository/salary.repository";
import { Allowance, Deduction } from "../types";
import { AppError } from "@/lib/errors";

export class SalaryService {
  /**
   * Upsert a salary configuration for an employee
   */
  static async configureSalary(
    organizationId: string,
    employeeId: string,
    userId: string,
    data: {
      currency: string;
      payFrequency: string;
      basicSalary: string;
      overtimeRate: string;
      workingDaysPerPeriod: string;
      workingHoursPerDay: string;
      fixedAllowances: Allowance[];
      fixedDeductions: Deduction[];
      effectiveFrom: string;
      effectiveTo?: string | null;
    }
  ) {
    const result = await SalaryRepository.upsertSalary(organizationId, employeeId, {
      ...data,
      updatedBy: userId,
    });

    await AuditService.log({
      organizationId,
      userId,
      action: "SALARY_CONFIGURED",
      entity: "salary_settings",
      entityId: result[0].id,
      details: {
        employeeId,
        currency: data.currency,
        basicSalary: data.basicSalary,
        payFrequency: data.payFrequency,
      }
    });

    return result[0];
  }

  /**
   * Get current salary configuration
   */
  static async getSalary(organizationId: string, employeeId: string) {
    const salary = await SalaryRepository.getByEmployeeId(organizationId, employeeId);
    if (!salary) {
      throw new AppError("SALARY_NOT_CONFIGURED", 404, "Salary configuration not found for employee");
    }
    return salary;
  }
}
