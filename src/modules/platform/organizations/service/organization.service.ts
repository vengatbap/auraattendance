import { organizationRepository } from "../repository/organization.repository";
import { mapToOrganizationDTO, OrganizationDTO } from "../types";
import { NotFoundError, ConflictError } from "@/lib/errors";
import { AuditService } from "@/modules/audit/service/audit.service";

export const organizationService = {
  async getById(id: string): Promise<OrganizationDTO> {
    const org = await organizationRepository.findById(id);
    if (!org) throw new NotFoundError("Organization not found");
    return mapToOrganizationDTO(org);
  },

  async getBySlug(slug: string): Promise<OrganizationDTO> {
    const org = await organizationRepository.findBySlug(slug);
    if (!org) throw new NotFoundError("Organization not found");
    return mapToOrganizationDTO(org);
  },

  async isSlugUnique(slug: string): Promise<boolean> {
    const org = await organizationRepository.findBySlug(slug);
    return org === null;
  },

  async create(data: {
    name: string;
    slug: string;
    subscriptionPlan?: string;
    logo?: string;
    favicon?: string;
    primaryColor?: string;
    secondaryColor?: string;
  }): Promise<OrganizationDTO> {
    const isUnique = await this.isSlugUnique(data.slug);
    if (!isUnique) {
      throw new ConflictError("Organization slug already exists");
    }

    const org = await organizationRepository.create(data);
    await AuditService.log({
      organizationId: org.id,
      action: "create",
      entity: "organization",
      entityId: org.id,
      details: { name: org.name, slug: org.slug },
    });

    return mapToOrganizationDTO(org);
  },

  async update(
    id: string,
    data: Partial<Record<string, unknown>>,
    adminUserId: string
  ): Promise<OrganizationDTO> {
    const existing = await organizationRepository.findById(id);
    if (!existing) throw new NotFoundError("Organization not found");

    if (typeof data.slug === "string" && data.slug !== existing.slug) {
      const isUnique = await this.isSlugUnique(data.slug);
      if (!isUnique) {
        throw new ConflictError("Organization slug already exists");
      }
    }

    const org = await organizationRepository.update(id, data);
    
    await AuditService.log({
      organizationId: org.id,
      userId: adminUserId,
      action: "update_settings",
      entity: "organization",
      entityId: org.id,
      details: data,
    });

    return mapToOrganizationDTO(org);
  },
};
