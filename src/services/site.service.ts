import { siteRepository } from "@/repositories/site.repository";
import type { SiteStatus } from "@/types";

export const siteService = {
  async list() {
    return siteRepository.findAll();
  },

  async getById(id: string) {
    const site = await siteRepository.findById(id);
    if (!site) throw new Error("Site not found");
    return site;
  },

  async create(data: { name: string; latitude: number; longitude: number; radius: number; status?: SiteStatus }) {
    return siteRepository.create(data as any);
  },

  async update(id: string, data: Partial<{ name: string; latitude: number; longitude: number; radius: number; status: SiteStatus }>) {
    await this.getById(id);
    return siteRepository.update(id, data as any);
  },

  async delete(id: string) {
    await this.getById(id);
    return siteRepository.delete(id);
  },
};
