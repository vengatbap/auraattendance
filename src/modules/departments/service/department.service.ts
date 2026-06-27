import { departmentRepository } from "../repository/department.repository";
import { mapToDepartmentDTO, DepartmentDTO } from "../types";
import { departmentCreateSchema, departmentUpdateSchema } from "../validator/department.validator";
import { NotFoundError, ValidationError } from "@/lib/errors";
import { AuditService } from "@/modules/audit/service/audit.service";

export const departmentService = {
  async list(organizationId: string): Promise<DepartmentDTO[]> {
    const list = await departmentRepository.findAll(organizationId);
    return list.map(mapToDepartmentDTO);
  },

  async listActive(organizationId: string): Promise<DepartmentDTO[]> {
    const list = await departmentRepository.findActive(organizationId);
    return list.map(mapToDepartmentDTO);
  },

  async getById(id: string, organizationId: string): Promise<DepartmentDTO> {
    const dept = await departmentRepository.findById(id, organizationId);
    if (!dept) throw new NotFoundError("Department not found");
    return mapToDepartmentDTO(dept);
  },

  async create(
    organizationId: string,
    data: unknown,
    adminUserId?: string
  ): Promise<DepartmentDTO> {
    const parsed = departmentCreateSchema.safeParse(data);
    if (!parsed.success) {
      throw new ValidationError("Invalid department parameters", parsed.error.flatten().fieldErrors);
    }

    const newDept = await departmentRepository.create(organizationId, parsed.data);

    void AuditService.log({
      organizationId,
      userId: adminUserId ?? null,
      action: "create",
      entity: "department",
      entityId: newDept.id,
      details: { name: newDept.name },
    });

    return mapToDepartmentDTO(newDept);
  },

  async update(
    id: string,
    organizationId: string,
    data: unknown,
    adminUserId?: string
  ): Promise<DepartmentDTO> {
    const existing = await departmentRepository.findById(id, organizationId);
    if (!existing) throw new NotFoundError("Department not found");

    const parsed = departmentUpdateSchema.safeParse(data);
    if (!parsed.success) {
      throw new ValidationError("Invalid department update parameters", parsed.error.flatten().fieldErrors);
    }

    const updated = await departmentRepository.update(id, organizationId, parsed.data);

    void AuditService.log({
      organizationId,
      userId: adminUserId ?? null,
      action: "update",
      entity: "department",
      entityId: updated.id,
      details: { before: existing, after: updated },
    });

    return mapToDepartmentDTO(updated);
  },

  async delete(id: string, organizationId: string, adminUserId?: string): Promise<void> {
    const existing = await departmentRepository.findById(id, organizationId);
    if (!existing) throw new NotFoundError("Department not found");

    await departmentRepository.delete(id, organizationId);

    void AuditService.log({
      organizationId,
      userId: adminUserId ?? null,
      action: "delete",
      entity: "department",
      entityId: id,
      details: { name: existing.name },
    });
  },
};
