import { db } from "@/db";
import { organizations, employees, faceProfiles, sites, attendanceLogs } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { ValidationError, NotFoundError, ConflictError } from "@/lib/errors";
import { logger } from "@/lib/logger";
import { haversineDistance, matchEmbedding, toDateString } from "@/utils";
import { attendanceRepository } from "../repository/attendance.repository";
import { AttendancePunchResult } from "../types";
import { AttendancePunchInput } from "../validator/attendance.validator";
import { AuditService } from "@/modules/audit/service/audit.service";

export class AttendanceService {
  async punch(
    input: AttendancePunchInput,
    ipAddress: string | null
  ): Promise<AttendancePunchResult> {
    return logger.track("attendanceService.punch", async () => {
      // 1. Resolve organizationId if provided
      let resolvedOrgId: string | null = null;
      if (input.organizationId) {
        resolvedOrgId = input.organizationId;
      } else if (input.orgSlug) {
        const [org] = await db
          .select()
          .from(organizations)
          .where(eq(organizations.slug, input.orgSlug))
          .limit(1);
        if (org) resolvedOrgId = org.id;
      }

      // 2. Fetch face profiles for matching
      const profilesQuery = db
        .select({
          employeeId: faceProfiles.employeeId,
          embedding: faceProfiles.embedding,
        })
        .from(faceProfiles);

      if (resolvedOrgId) {
        profilesQuery.where(eq(faceProfiles.organizationId, resolvedOrgId));
      }
      const allProfiles = await profilesQuery;

      const mappedProfiles = allProfiles.map((p) => ({
        employeeId: p.employeeId,
        embedding: p.embedding as number[],
      }));

      // 3. Match face embedding
      const match = matchEmbedding(input.descriptor, mappedProfiles);
      if (!match) {
        throw new NotFoundError("Face profile not recognized");
      }

      // 4. Fetch matched employee
      const [employee] = await db
        .select()
        .from(employees)
        .where(
          and(
            eq(employees.id, match.employeeId),
            eq(employees.status, "active")
          )
        )
        .limit(1);

      if (!employee) {
        throw new NotFoundError("Active employee profile not found");
      }

      const orgId = employee.organizationId;
      if (!orgId) {
        throw new ValidationError("Employee is not assigned to an organization");
      }

      // 5. Fetch organization configuration
      const [orgConfig] = await db
        .select()
        .from(organizations)
        .where(eq(organizations.id, orgId))
        .limit(1);

      if (!orgConfig) {
        throw new ValidationError("Organization configurations not found");
      }

      // Verify face match score matches threshold
      const matchThreshold = orgConfig.faceMatchThreshold ?? 0.6;
      if (match.score < (1 - matchThreshold)) {
        throw new ValidationError("Biometric match quality too low");
      }

      const today = toDateString();

      // 6. Run lazy auto-checkout for forgotten punches on previous days
      if (orgConfig.autoCheckout) {
        const pendingLogs = await attendanceRepository.findPendingPreviousDays(
          orgId,
          employee.id,
          today
        );
        for (const log of pendingLogs) {
          const [hour, minute] = (orgConfig.autoCheckoutTime || "23:59")
            .split(":")
            .map(Number);
          const closeDate = new Date(log.checkInTime || log.createdAt);
          closeDate.setHours(hour, minute, 0, 0);

          await db
            .update(attendanceLogs)
            .set({
              checkOutTime: closeDate,
              updatedAt: new Date(),
            })
            .where(eq(attendanceLogs.id, log.id));
        }
      }

      // 7. Geofence Site Detection
      const activeSites = await db
        .select()
        .from(sites)
        .where(
          and(
            eq(sites.organizationId, orgId),
            eq(sites.status, "active")
          )
        );

      const nearest = activeSites
        .map((candidate) => ({
          site: candidate,
          distance: haversineDistance(
            input.latitude,
            input.longitude,
            candidate.latitude,
            candidate.longitude
          ),
        }))
        .sort((a, b) => a.distance - b.distance)[0];

      const matchedSite =
        nearest && nearest.distance <= nearest.site.radius ? nearest.site : null;
      const distance = nearest?.distance ?? null;

      const siteResult = matchedSite
        ? { id: matchedSite.id, name: matchedSite.name, matched: true }
        : {
            id: null,
            name: "Unknown location",
            matched: false,
            nearestSiteName: nearest?.site.name ?? null,
          };

      // 8. Find existing attendance record for today
      const existing = await attendanceRepository.findTodayByEmployee(
        orgId,
        employee.id,
        today
      );

      // Check minimum punch gap
      if (existing) {
        const lastPunchTime = existing.checkOutTime
          ? new Date(existing.checkOutTime)
          : new Date(existing.checkInTime || existing.createdAt);
        const diffMinutes = (Date.now() - lastPunchTime.getTime()) / (1000 * 60);

        if (diffMinutes < (orgConfig.minimumPunchGapMinutes ?? 30)) {
          throw new ConflictError(
            `Punch gap restriction. Please wait ${Math.ceil(
              (orgConfig.minimumPunchGapMinutes ?? 30) - diffMinutes
            )} minutes.`
          );
        }
      }

      if (!existing) {
        // Perform CHECK-IN
        const [lateHour, lateMinute] = (orgConfig.lateAfterTime || "09:15")
          .split(":")
          .map(Number);
        const grace = orgConfig.gracePeriodMinutes ?? 15;
        const lateLimitMinutes = lateHour * 60 + lateMinute + grace;

        const nowTime = new Date();
        const currentMinutes = nowTime.getHours() * 60 + nowTime.getMinutes();
        const status = currentMinutes > lateLimitMinutes ? "late" : "present";

        const log = await attendanceRepository.create(orgId, {
          employeeId: employee.id,
          siteId: matchedSite?.id ?? null,
          date: today,
          checkInTime: nowTime,
          status,
          confidenceScore: match.score,
          gpsDistanceMeters: distance,
          gpsLatitude: input.latitude,
          gpsLongitude: input.longitude,
          photoUrl: input.photo,
          deviceInfo: input.deviceInfo,
          browser: input.browser,
          ipAddress,
          punchType: "in",
        });

        // Audit Log
        await AuditService.log({
          organizationId: orgId,
          userId: null,
          action: "check_in",
          entity: "attendance_log",
          entityId: log.id,
          details: { siteName: siteResult.name, faceScore: match.score, employeeId: employee.id, employeeName: employee.name },
        });

        return {
          action: "check_in",
          matched: true,
          employee: {
            id: employee.id,
            name: employee.name,
            employeeCode: employee.employeeCode,
          },
          site: siteResult,
          attendanceLog: log,
          faceScore: match.score,
          distanceMeters: distance,
          locationMatched: Boolean(matchedSite),
          latitude: input.latitude,
          longitude: input.longitude,
        };
      }

      // Check-out scenarios
      if (existing.checkOutTime && !orgConfig.allowMultiplePunches) {
        return {
          action: "already_checked_out",
          matched: true,
          employee: {
            id: employee.id,
            name: employee.name,
            employeeCode: employee.employeeCode,
          },
          site: siteResult,
          attendanceLog: existing,
          faceScore: match.score,
          distanceMeters: distance,
          locationMatched: Boolean(matchedSite),
          latitude: input.latitude,
          longitude: input.longitude,
        };
      }

      // Perform CHECK-OUT (or overwrite checkout if multiple checkouts allowed)
      const log = await attendanceRepository.update(existing.id, orgId, {
        checkOutTime: new Date(),
        confidenceScore: match.score,
        gpsDistanceMeters: distance,
        gpsLatitude: input.latitude,
        gpsLongitude: input.longitude,
        photoUrl: input.photo,
        deviceInfo: input.deviceInfo,
        browser: input.browser,
        ipAddress,
        punchType: "out",
      });

      // Audit Log
      await AuditService.log({
        organizationId: orgId,
        userId: null,
        action: "check_out",
        entity: "attendance_log",
        entityId: log.id,
        details: { siteName: siteResult.name, faceScore: match.score, employeeId: employee.id, employeeName: employee.name },
      });

      return {
        action: "check_out",
        matched: true,
        employee: {
          id: employee.id,
          name: employee.name,
          employeeCode: employee.employeeCode,
        },
        site: siteResult,
        attendanceLog: log,
        faceScore: match.score,
        distanceMeters: distance,
        locationMatched: Boolean(matchedSite),
        latitude: input.latitude,
        longitude: input.longitude,
      };
    });
  }
}

export const attendanceService = new AttendanceService();
