export interface EmployeeEntity {
  id: string;
  organizationId: string | null;
  employeeCode: string;
  governmentId: string;
  name: string;
  siteId: string | null;
  departmentId: string | null;
  designation: string | null;
  phone: string | null;
  email: string | null;
  status: "active" | "inactive" | "suspended" | "resigned";
  isActive: boolean;
  enrollmentPhoto: string | null;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
  version: number;
}

export interface EmployeeDTO {
  id: string;
  organizationId: string | null;
  employeeCode: string;
  governmentId: string;
  name: string;
  siteId: string | null;
  departmentId: string | null;
  designation: string | null;
  phone: string | null;
  email: string | null;
  status: "active" | "inactive" | "suspended" | "resigned";
  isActive: boolean;
  isFaceEnrolled?: boolean;
  enrollmentPhoto: string | null;
  createdAt: string;
  updatedAt: string;
}

export function mapToEmployeeDTO(entity: EmployeeEntity & { isFaceEnrolled?: boolean }): EmployeeDTO {
  return {
    id: entity.id,
    organizationId: entity.organizationId,
    employeeCode: entity.employeeCode,
    governmentId: entity.governmentId,
    name: entity.name,
    siteId: entity.siteId,
    departmentId: entity.departmentId,
    designation: entity.designation,
    phone: entity.phone,
    email: entity.email,
    status: entity.status,
    isActive: entity.isActive,
    isFaceEnrolled: entity.isFaceEnrolled,
    enrollmentPhoto: entity.enrollmentPhoto,
    createdAt: entity.createdAt.toISOString(),
    updatedAt: entity.updatedAt.toISOString(),
  };
}
