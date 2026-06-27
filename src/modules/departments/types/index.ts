export interface DepartmentDTO {
  id: string;
  organizationId: string;
  name: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export interface DepartmentEntity {
  id: string;
  organizationId: string;
  name: string;
  status: string;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}

export function mapToDepartmentDTO(dept: DepartmentEntity): DepartmentDTO {
  return {
    id: dept.id,
    organizationId: dept.organizationId,
    name: dept.name,
    status: dept.status,
    createdAt: dept.createdAt.toISOString(),
    updatedAt: dept.updatedAt.toISOString(),
  };
}
