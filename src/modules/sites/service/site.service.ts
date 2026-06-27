import { siteRepository } from "../repository/site.repository";
import { mapToSiteDTO, SiteDTO } from "../types";
import { siteCreateSchema, siteUpdateSchema } from "../validator/site.validator";
import { NotFoundError, ValidationError } from "@/lib/errors";
import { AuditService } from "@/modules/audit/service/audit.service";

export const siteService = {
  async list(organizationId: string): Promise<SiteDTO[]> {
    const list = await siteRepository.findAll(organizationId);
    return list.map(mapToSiteDTO);
  },

  async listActive(organizationId: string): Promise<SiteDTO[]> {
    const list = await siteRepository.findActive(organizationId);
    return list.map(mapToSiteDTO);
  },

  async getById(id: string, organizationId: string): Promise<SiteDTO> {
    const site = await siteRepository.findById(id, organizationId);
    if (!site) throw new NotFoundError("Site not found");
    return mapToSiteDTO(site);
  },

  async create(
    organizationId: string,
    data: unknown,
    adminUserId?: string
  ): Promise<SiteDTO> {
    const parsed = siteCreateSchema.safeParse(data);
    if (!parsed.success) {
      throw new ValidationError("Invalid site parameters", parsed.error.flatten().fieldErrors);
    }

    const newSite = await siteRepository.create(organizationId, parsed.data);

    void AuditService.log({
      organizationId,
      userId: adminUserId ?? null,
      action: "create",
      entity: "site",
      entityId: newSite.id,
      details: { name: newSite.name, allowedDevices: newSite.allowedDevices },
    });

    return mapToSiteDTO(newSite);
  },

  async update(
    id: string,
    organizationId: string,
    data: unknown,
    adminUserId?: string
  ): Promise<SiteDTO> {
    const existing = await siteRepository.findById(id, organizationId);
    if (!existing) throw new NotFoundError("Site not found");

    const parsed = siteUpdateSchema.safeParse(data);
    if (!parsed.success) {
      throw new ValidationError("Invalid site update parameters", parsed.error.flatten().fieldErrors);
    }

    const updated = await siteRepository.update(id, organizationId, parsed.data);

    void AuditService.log({
      organizationId,
      userId: adminUserId ?? null,
      action: "update",
      entity: "site",
      entityId: updated.id,
      details: { before: existing, after: updated },
    });

    return mapToSiteDTO(updated);
  },

  async delete(id: string, organizationId: string, adminUserId?: string): Promise<void> {
    const existing = await siteRepository.findById(id, organizationId);
    if (!existing) throw new NotFoundError("Site not found");

    await siteRepository.delete(id, organizationId);

    void AuditService.log({
      organizationId,
      userId: adminUserId ?? null,
      action: "delete",
      entity: "site",
      entityId: id,
      details: { name: existing.name },
    });
  },
};
