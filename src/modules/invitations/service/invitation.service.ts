import { randomBytes } from "crypto";
import { invitationRepository } from "../repository/invitation.repository";
import { mapToInvitationDTO, InvitationDTO } from "../types";
import { NotFoundError, ValidationError, ConflictError } from "@/lib/errors";
import { AuditService } from "@/modules/audit/service/audit.service";

export const invitationService = {
  async inviteAdmin(
    organizationId: string,
    email: string,
    invitedByUserId: string
  ): Promise<InvitationDTO> {
    // Check if there is already an active pending invitation
    const existing = await invitationRepository.findByEmailAndOrg(email, organizationId);
    if (existing && existing.status === "pending" && existing.expiresAt > new Date()) {
      throw new ConflictError("An active invitation already exists for this email address");
    }

    // Generate a secure token
    const token = randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days expiration

    const inv = await invitationRepository.create({
      organizationId,
      email,
      token,
      expiresAt,
    });

    await AuditService.log({
      organizationId,
      userId: invitedByUserId,
      action: "invite_admin",
      entity: "user_invitation",
      entityId: inv.id,
      details: { email },
    });

    return mapToInvitationDTO(inv);
  },

  async verifyToken(token: string): Promise<InvitationDTO> {
    const inv = await invitationRepository.findByToken(token);
    if (!inv) {
      throw new NotFoundError("Invitation token not found or invalid");
    }

    if (inv.status !== "pending") {
      throw new ValidationError(`This invitation has already been ${inv.status}`);
    }

    if (inv.expiresAt < new Date()) {
      await invitationRepository.updateStatus(inv.id, "expired");
      throw new ValidationError("This invitation has expired");
    }

    return mapToInvitationDTO(inv);
  },

  async acceptInvitation(token: string): Promise<InvitationDTO> {
    const inv = await this.verifyToken(token);
    const updated = await invitationRepository.updateStatus(inv.id, "accepted");
    
    await AuditService.log({
      organizationId: updated.organizationId,
      action: "accept_invitation",
      entity: "user_invitation",
      entityId: updated.id,
      details: { email: updated.email },
    });

    return mapToInvitationDTO(updated);
  },
};
