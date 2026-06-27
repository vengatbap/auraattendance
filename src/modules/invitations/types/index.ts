export interface InvitationDTO {
  id: string;
  organizationId: string;
  email: string;
  token: string;
  status: string; // "pending", "accepted", "expired"
  expiresAt: string;
  createdAt: string;
}

export function mapToInvitationDTO(inv: {
  id: string;
  organizationId: string;
  email: string;
  token: string;
  status: string;
  expiresAt: Date;
  createdAt: Date;
}): InvitationDTO {
  return {
    id: inv.id,
    organizationId: inv.organizationId,
    email: inv.email,
    token: inv.token,
    status: inv.status,
    expiresAt: inv.expiresAt.toISOString(),
    createdAt: inv.createdAt.toISOString(),
  };
}
