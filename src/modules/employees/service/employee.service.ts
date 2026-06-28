import { ValidationError, NotFoundError, ConflictError } from "@/lib/errors";
import { employeeRepository } from "../repository/employee.repository";
import {
  createEmployeeSchema,
  updateEmployeeSchema,
} from "../validator/employee.validator";
import { EmployeeDTO, mapToEmployeeDTO } from "../types";
import { AuditService } from "@/modules/audit/service/audit.service";
import { logger } from "@/lib/logger";

export class EmployeeService {
  async create(
    organizationId: string,
    body: unknown,
    operatorUserId: string
  ): Promise<EmployeeDTO> {
    return logger.track("employeeService.create", async () => {
      const parsed = createEmployeeSchema.safeParse(body);
      if (!parsed.success) {
        throw new ValidationError("Invalid employee inputs", parsed.error.format());
      }

      const input = parsed.data;

      // Check duplicate code, governmentId or email
      const existing = await employeeRepository.findDuplicate(
        organizationId,
        input.employeeCode,
        input.governmentId,
        input.email
      );

      if (existing) {
        throw new ConflictError(
          "Employee code, Government ID, or email already exists in this tenant"
        );
      }

      const entity = await employeeRepository.create(organizationId, input);

      // Audit Log
      await AuditService.log({
        organizationId,
        userId: operatorUserId,
        action: "create",
        entity: "employee",
        entityId: entity.id,
        details: { employeeCode: entity.employeeCode, name: entity.name },
      });

      return mapToEmployeeDTO(entity);
    });
  }

  async getById(id: string, organizationId: string): Promise<EmployeeDTO> {
    return logger.track("employeeService.getById", async () => {
      const entity = await employeeRepository.findById(id, organizationId);
      if (!entity) {
        throw new NotFoundError("Employee not found");
      }
      return mapToEmployeeDTO(entity);
    });
  }

  async list(organizationId: string): Promise<EmployeeDTO[]> {
    return logger.track("employeeService.list", async () => {
      const list = await employeeRepository.list(organizationId);
      return list.map(mapToEmployeeDTO);
    });
  }

  async update(
    id: string,
    organizationId: string,
    body: unknown,
    operatorUserId: string
  ): Promise<EmployeeDTO> {
    return logger.track("employeeService.update", async () => {
      const parsed = updateEmployeeSchema.safeParse(body);
      if (!parsed.success) {
        throw new ValidationError("Invalid employee inputs", parsed.error.format());
      }

      const input = parsed.data;

      // Fetch existing employee
      const employee = await employeeRepository.findById(id, organizationId);
      if (!employee) {
        throw new NotFoundError("Employee not found");
      }

      // If updating code/governmentId/email, verify they don't clash with another employee
      const checkCode = input.employeeCode || employee.employeeCode;
      const checkGovId = input.governmentId || employee.governmentId;
      const checkEmail = input.email !== undefined ? input.email : employee.email;

      const duplicate = await employeeRepository.findDuplicate(
        organizationId,
        checkCode,
        checkGovId,
        checkEmail
      );

      if (duplicate && duplicate.id !== id) {
        throw new ConflictError(
          "Employee code, Government ID, or email already exists in this tenant"
        );
      }

      const updated = await employeeRepository.update(id, organizationId, input);

      // Audit Log
      await AuditService.log({
        organizationId,
        userId: operatorUserId,
        action: "update",
        entity: "employee",
        entityId: id,
        details: { changes: input },
      });

      return mapToEmployeeDTO(updated);
    });
  }

  async delete(id: string, organizationId: string, operatorUserId: string): Promise<void> {
    return logger.track("employeeService.delete", async () => {
      const employee = await employeeRepository.findById(id, organizationId);
      if (!employee) {
        throw new NotFoundError("Employee not found");
      }

      await employeeRepository.delete(id, organizationId);

      // Audit Log
      await AuditService.log({
        organizationId,
        userId: operatorUserId,
        action: "delete",
        entity: "employee",
        entityId: id,
        details: { employeeCode: employee.employeeCode, name: employee.name },
      });
    });
  }
}

export const employeeService = new EmployeeService();
