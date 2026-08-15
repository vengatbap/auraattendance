import { db } from "@/db";
import { organizations } from "@/db/schema";
import { eq } from "drizzle-orm";

export const FeatureRegistry = {
  FACE: "face" as const,
  GPS: "gps" as const,
  QR: "qr" as const,
  OFFLINE: "offline" as const,
  ADJUSTMENTS: "adjustments" as const,
  REPORTS: "reports" as const,
  ANALYTICS: "analytics" as const,
} as const;

export type FeatureKey = typeof FeatureRegistry[keyof typeof FeatureRegistry];

export class FeatureService {
  /**
   * Checks if a feature is enabled for an organization.
   */
  public static async isEnabled(organizationId: string, feature: FeatureKey): Promise<boolean> {
    const [org] = await db
      .select({ featureFlags: organizations.featureFlags })
      .from(organizations)
      .where(eq(organizations.id, organizationId))
      .limit(1);

    if (!org || !org.featureFlags) return false;
    const flags = org.featureFlags as Record<string, boolean>;
    return flags[feature] === true;
  }
}
