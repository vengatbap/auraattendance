import { PunchStage } from "../engine/pipeline";
import { PunchContext } from "../engine/context";
import { AttendanceEngineRepository } from "../repository/attendance-engine.repository";

export class EmployeeValidationStage implements PunchStage {
  async execute(context: PunchContext): Promise<void> {
    if (context.outcome === "REJECTED") return;

    const orgId = context.trusted.organizationId;
    let employee = null;

    if (context.input.employeeId) {
      employee = await AttendanceEngineRepository.findEmployeeById(orgId, context.input.employeeId);
    } else if (context.input.employeeCode) {
      employee = await AttendanceEngineRepository.findEmployeeByCode(orgId, context.input.employeeCode);
    }

    if (!employee) {
      context.outcome = "REJECTED";
      context.resolvedPunchType = undefined;
      context.warnings.push("Employee profile not found");
      return;
    }

    // Verify tenant ownership
    if (employee.organizationId !== orgId) {
      context.outcome = "REJECTED";
      context.resolvedPunchType = undefined;
      context.warnings.push("Cross-tenant employee validation violation");
      return;
    }

    // Verify employee status is active
    if (employee.status !== "active") {
      context.outcome = "REJECTED";
      context.resolvedPunchType = undefined;
      context.warnings.push(`Employee status is invalid: ${employee.status}`);
      return;
    }

    context.employee = employee;
  }
}
