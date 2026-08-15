export interface OrganizationDTO {
  id: string;
  name: string;
  slug: string;
  status: string;
  logo: string | null;
  favicon: string | null;
  primaryColor: string;
  secondaryColor: string;
  loginBackground: string | null;
  sidebarLogo: string | null;
  companyName: string | null;
  supportEmail: string | null;
  timezone: string;
  language: string;
  dateFormat: string;
  isOnboarded: boolean;
  subscriptionPlan: string;
  trialEndsAt: string | null;
  featureFlags: {
    face: boolean;
    gps: boolean;
    qr: boolean;
    offline: boolean;
    adjustments: boolean;
    reports: boolean;
    analytics: boolean;
  };
  attendanceMode: string;
  allowMultiplePunches: boolean;
  minimumPunchGapMinutes: number;
  autoCheckout: boolean;
  autoCheckoutTime: string;
  gracePeriodMinutes: number;
  lateAfterTime: string;
  faceMatchThreshold: number;
  faceLightingThreshold: number;
  faceMinSize: number;
  faceCaptureDelaySeconds: number;
  faceRetryAttempts: number;
  createdAt: string;
  updatedAt: string;
}

export interface OrganizationEntity {
  id: string;
  name: string;
  slug: string;
  status: string;
  logo: string | null;
  favicon: string | null;
  primaryColor: string;
  secondaryColor: string;
  loginBackground: string | null;
  sidebarLogo: string | null;
  companyName: string | null;
  supportEmail: string | null;
  timezone: string;
  language: string;
  dateFormat: string;
  isOnboarded: boolean;
  subscriptionPlan: string;
  trialEndsAt: Date | null;
  featureFlags: unknown;
  attendanceMode: string;
  allowMultiplePunches: boolean;
  minimumPunchGapMinutes: number;
  autoCheckout: boolean;
  autoCheckoutTime: string;
  gracePeriodMinutes: number;
  lateAfterTime: string;
  faceMatchThreshold: number;
  faceLightingThreshold: number;
  faceMinSize: number;
  faceCaptureDelaySeconds: number;
  faceRetryAttempts: number;
  createdAt: Date;
  updatedAt: Date;
}

export function mapToOrganizationDTO(org: OrganizationEntity): OrganizationDTO {
  return {
    id: org.id,
    name: org.name,
    slug: org.slug,
    status: org.status,
    logo: org.logo,
    favicon: org.favicon,
    primaryColor: org.primaryColor,
    secondaryColor: org.secondaryColor,
    loginBackground: org.loginBackground,
    sidebarLogo: org.sidebarLogo,
    companyName: org.companyName,
    supportEmail: org.supportEmail,
    timezone: org.timezone,
    language: org.language,
    dateFormat: org.dateFormat,
    isOnboarded: org.isOnboarded,
    subscriptionPlan: org.subscriptionPlan,
    trialEndsAt: org.trialEndsAt ? org.trialEndsAt.toISOString() : null,
    featureFlags: (org.featureFlags as {
      face: boolean;
      gps: boolean;
      qr: boolean;
      offline: boolean;
      adjustments: boolean;
      reports: boolean;
      analytics: boolean;
    }) || {
      face: true,
      gps: true,
      qr: false,
      offline: true,
      adjustments: true,
      reports: true,
      analytics: true,
    },
    attendanceMode: org.attendanceMode,
    allowMultiplePunches: org.allowMultiplePunches,
    minimumPunchGapMinutes: org.minimumPunchGapMinutes,
    autoCheckout: org.autoCheckout,
    autoCheckoutTime: org.autoCheckoutTime,
    gracePeriodMinutes: org.gracePeriodMinutes,
    lateAfterTime: org.lateAfterTime,
    faceMatchThreshold: org.faceMatchThreshold,
    faceLightingThreshold: org.faceLightingThreshold,
    faceMinSize: org.faceMinSize,
    faceCaptureDelaySeconds: org.faceCaptureDelaySeconds,
    faceRetryAttempts: org.faceRetryAttempts,
    createdAt: org.createdAt.toISOString(),
    updatedAt: org.updatedAt.toISOString(),
  };
}
