import { db } from "@/db";
import { sites } from "@/db/schema";
import { and, eq, isNull } from "drizzle-orm";
import { SiteEntity } from "../types";

export const siteRepository = {
  async findAll(organizationId: string): Promise<SiteEntity[]> {
    return db
      .select()
      .from(sites)
      .where(and(eq(sites.organizationId, organizationId), isNull(sites.deletedAt))) as Promise<SiteEntity[]>;
  },

  async findActive(organizationId: string): Promise<SiteEntity[]> {
    return db
      .select()
      .from(sites)
      .where(
        and(
          eq(sites.organizationId, organizationId),
          eq(sites.status, "active"),
          isNull(sites.deletedAt)
        )
      ) as Promise<SiteEntity[]>;
  },

  async findById(id: string, organizationId: string): Promise<SiteEntity | null> {
    const [result] = await db
      .select()
      .from(sites)
      .where(
        and(
          eq(sites.id, id),
          eq(sites.organizationId, organizationId),
          isNull(sites.deletedAt)
        )
      )
      .limit(1);
    return (result as SiteEntity) ?? null;
  },

  async create(organizationId: string, data: {
    name: string;
    latitude: number;
    longitude: number;
    radius: number;
    status: "active" | "inactive";
    allowedDevices: "browser" | "kiosk" | "tablet" | "both";
    projectId?: string | null;
  }): Promise<SiteEntity> {
    const [result] = await db
      .insert(sites)
      .values({
        organizationId,
        projectId: data.projectId ?? null,
        name: data.name,
        latitude: data.latitude,
        longitude: data.longitude,
        radius: data.radius,
        status: data.status,
        allowedDevices: data.allowedDevices,
      })
      .returning();
    return result as SiteEntity;
  },

  async update(
    id: string,
    organizationId: string,
    data: Partial<{
      name: string;
      latitude: number;
      longitude: number;
      radius: number;
      status: "active" | "inactive";
      allowedDevices: "browser" | "kiosk" | "tablet" | "both";
    }>
  ): Promise<SiteEntity> {
    const [result] = await db
      .update(sites)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(and(eq(sites.id, id), eq(sites.organizationId, organizationId)))
      .returning();
    return result as SiteEntity;
  },

  async delete(id: string, organizationId: string): Promise<void> {
    // Soft delete to preserve log history
    await db
      .update(sites)
      .set({ deletedAt: new Date() })
      .where(and(eq(sites.id, id), eq(sites.organizationId, organizationId)));
  },
};
