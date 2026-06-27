export interface SiteDTO {
  id: string;
  organizationId: string | null;
  projectId: string | null;
  name: string;
  latitude: number;
  longitude: number;
  radius: number;
  status: string;
  allowedDevices: string;
  createdAt: string;
  updatedAt: string;
}

export interface SiteEntity {
  id: string;
  organizationId: string | null;
  projectId: string | null;
  name: string;
  latitude: number;
  longitude: number;
  radius: number;
  status: string;
  allowedDevices: string;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}

export function mapToSiteDTO(site: SiteEntity): SiteDTO {
  return {
    id: site.id,
    organizationId: site.organizationId,
    projectId: site.projectId,
    name: site.name,
    latitude: site.latitude,
    longitude: site.longitude,
    radius: site.radius,
    status: site.status,
    allowedDevices: site.allowedDevices,
    createdAt: site.createdAt.toISOString(),
    updatedAt: site.updatedAt.toISOString(),
  };
}
