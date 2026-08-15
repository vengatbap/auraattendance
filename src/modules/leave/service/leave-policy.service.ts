import { LeaveTypeRepository } from "../repository/leave-type.repository";
import { NewLeaveType } from "../types";
import { AuditService } from "@/modules/audit/service/audit.service";

export class LeavePolicyService {
  static async createType(data: NewLeaveType) {
    const type = await LeaveTypeRepository.create(data);
    if (data.createdBy) {
      await AuditService.log({
        organizationId: data.organizationId,
        userId: data.createdBy,
        action: "LEAVE_TYPE_CREATED",
        entity: "leave_types",
        entityId: type.id,
        details: { code: data.code, name: data.name }
      });
    }
    return type;
  }

  static async updateType(id: string, organizationId: string, data: Partial<NewLeaveType>) {
    return LeaveTypeRepository.update(id, organizationId, data);
  }

  static async listTypes(organizationId: string) {
    return LeaveTypeRepository.list(organizationId);
  }
  
  static async getType(id: string, organizationId: string) {
    return LeaveTypeRepository.findById(id, organizationId);
  }
}
