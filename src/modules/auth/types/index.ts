export interface UserDTO {
  id: string;
  organizationId: string | null;
  email: string;
  name: string;
  role: string;
  createdAt: string;
  updatedAt: string;
}

export interface SessionDTO {
  id: string;
  userId: string;
  organizationId: string | null;
  token: string;
  expiresAt: string;
}

export function mapToUserDTO(user: {
  id: string;
  organizationId: string | null;
  email: string;
  name: string;
  role: string;
  createdAt: Date;
  updatedAt: Date;
}): UserDTO {
  return {
    id: user.id,
    organizationId: user.organizationId,
    email: user.email,
    name: user.name,
    role: user.role,
    createdAt: user.createdAt.toISOString(),
    updatedAt: user.updatedAt.toISOString(),
  };
}
