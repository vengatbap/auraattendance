import { PunchStage } from "../engine/pipeline";
import { PunchContext } from "../engine/context";
import { AttendanceEngineRepository } from "../repository/attendance-engine.repository";
import { FeatureService, FeatureRegistry } from "@/lib/features";
import { haversineDistance } from "@/utils";
import { AttendanceFlag } from "../types";

export class GeofenceStage implements PunchStage {
  async execute(context: PunchContext): Promise<void> {
    if (context.outcome === "REJECTED") return;

    const orgId = context.trusted.organizationId;
    const isGpsEnabled = await FeatureService.isEnabled(orgId, FeatureRegistry.GPS);
    if (!isGpsEnabled) {
      return; // Skip GPS geofencing if feature is disabled
    }

    const lat = context.input.latitude;
    const lon = context.input.longitude;

    if (lat === undefined || lon === undefined || lat === null || lon === null) {
      context.flags.push(AttendanceFlag.GPS_UNAVAILABLE);
      context.warnings.push("GPS coordinates missing from request payload");
      return;
    }

    const activeSites = await AttendanceEngineRepository.findActiveSites(orgId);
    if (activeSites.length === 0) {
      context.flags.push(AttendanceFlag.GPS_UNAVAILABLE);
      context.warnings.push("No active geofenced sites configured for organization");
      return;
    }

    // Filter by kiosk allowed site if configured
    const allowedSiteId = context.trusted.allowedSiteId;
    let sitesToCheck = activeSites;
    if (allowedSiteId) {
      sitesToCheck = activeSites.filter((s) => s.id === allowedSiteId);
      if (sitesToCheck.length === 0) {
        context.flags.push(AttendanceFlag.OUTSIDE_GEOFENCE);
        context.warnings.push(`Allowed kiosk site ${allowedSiteId} is not active`);
        return;
      }
    }

    // Find closest site
    let closestSite = null;
    let minDistance = Infinity;

    for (const site of sitesToCheck) {
      const dist = haversineDistance(lat, lon, Number(site.latitude), Number(site.longitude));
      if (dist < minDistance) {
        minDistance = dist;
        closestSite = site;
      }
    }

    if (closestSite) {
      context.site = closestSite;
      context.gpsDistanceMeters = minDistance;

      const allowedRadius = Number(closestSite.radius);
      if (minDistance > allowedRadius) {
        context.flags.push(AttendanceFlag.OUTSIDE_GEOFENCE);
        context.warnings.push(`Geofence boundary violated: distance=${minDistance.toFixed(1)}m, radius=${allowedRadius}m`);
      }
    } else {
      context.flags.push(AttendanceFlag.GPS_UNAVAILABLE);
    }
  }
}
