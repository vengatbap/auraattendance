import { db } from "@/db";
import { attendanceLogs, attendanceEvents, users, employees, faceProfiles, attendanceAdjustments, auditLogs, organizations } from "@/db/schema";
import { and, isNull, eq, sql, gt, lt, ne, desc, isNotNull, inArray } from "drizzle-orm";

export enum AnomalyType {
  MISSING_CHECKOUT = "MISSING_CHECKOUT",
  OUTSIDE_GEOFENCE = "OUTSIDE_GEOFENCE",
  FACE_LOW_CONFIDENCE = "FACE_LOW_CONFIDENCE",
  DUPLICATE_PUNCH = "DUPLICATE_PUNCH",
  OFFLINE_SYNC = "OFFLINE_SYNC",
  FACE_NOT_REGISTERED = "FACE_NOT_REGISTERED",
}

export class OperationsService {
  static async getAnomalies(organizationId: string) {
    const anomalies: any[] = [];
    const todayStr = new Date().toISOString().split("T")[0];

    const logs = await db.query.attendanceLogs.findMany({
      where: eq(attendanceLogs.organizationId, organizationId),
      with: { employee: true, site: true },
      orderBy: [desc(attendanceLogs.createdAt)],
      limit: 200,
    });

    const logIds = logs.map(l => l.id);
    let resolvedLogIds = new Set<string>();
    
    if (logIds.length > 0) {
      const adjustments = await db.query.attendanceAdjustments.findMany({
        where: sql`${attendanceAdjustments.attendanceLogId} IN ${logIds}`,
      });
      adjustments.forEach(adj => resolvedLogIds.add(adj.attendanceLogId));
    }

    for (const log of logs) {
      if (resolvedLogIds.has(log.id)) continue;

      const dateStr = typeof log.date === "string" ? log.date : (log.date as any).toISOString().split("T")[0];
      const flags = log.flags as string[] || [];

      // MISSING_CHECKOUT
      if (log.checkInTime && !log.checkOutTime && dateStr < todayStr) {
        anomalies.push({
          id: `MC_${log.id}`,
          logId: log.id,
          employee: log.employee,
          type: AnomalyType.MISSING_CHECKOUT,
          title: "Missing Checkout",
          description: "Employee missed checkout yesterday.",
          data: log,
        });
        continue;
      }

      // OUTSIDE_GEOFENCE
      if ((log.gpsDistanceMeters && log.gpsDistanceMeters > 50) || flags.includes("OUTSIDE_GEOFENCE")) {
        anomalies.push({
          id: `OG_${log.id}`,
          logId: log.id,
          employee: log.employee,
          type: AnomalyType.OUTSIDE_GEOFENCE,
          title: "Outside Geofence",
          description: "Punch recorded outside allowed radius.",
          data: log,
        });
        continue;
      }

      // FACE_LOW_CONFIDENCE
      if (log.confidenceScore !== null && log.confidenceScore < 0.6) {
        anomalies.push({
          id: `FLC_${log.id}`,
          logId: log.id,
          employee: log.employee,
          type: AnomalyType.FACE_LOW_CONFIDENCE,
          title: "Face Low Confidence",
          description: `Confidence score: ${Math.round(log.confidenceScore * 100)}%`,
          data: log,
        });
        continue;
      }

      // OFFLINE_SYNC
      if (log.isOffline) {
        anomalies.push({
          id: `OS_${log.id}`,
          logId: log.id,
          employee: log.employee,
          type: AnomalyType.OFFLINE_SYNC,
          title: "Offline Sync",
          description: "Punch was synchronized while offline.",
          data: log,
        });
        continue;
      }
      
      // DUPLICATE_PUNCH
      if (flags.includes("DUPLICATE_PUNCH")) {
        anomalies.push({
          id: `DP_${log.id}`,
          logId: log.id,
          employee: log.employee,
          type: AnomalyType.DUPLICATE_PUNCH,
          title: "Duplicate Punch",
          description: "Multiple punches within minimum gap.",
          data: log,
        });
      }
    }

    // FACE_NOT_REGISTERED
    const allEmployees = await db.query.employees.findMany({
      where: eq(employees.organizationId, organizationId),
      with: { faceProfiles: true },
    });
    
    for (const emp of allEmployees) {
      if (emp.faceProfiles.length === 0) {
        anomalies.push({
          id: `FNR_${emp.id}`,
          logId: null,
          employeeId: emp.id,
          employee: emp,
          type: AnomalyType.FACE_NOT_REGISTERED,
          title: "Face Not Registered",
          description: "Employee does not have an active face profile.",
          data: emp,
        });
      }
    }

    return anomalies;
  }

  static async resolve(
    organizationId: string, 
    userId: string, 
    id: string, 
    resolutionType: string, 
    reason: string,
    extraData?: any
  ) {
    const logId = id.split("_").slice(1).join("_");
    
    if (id.startsWith("FNR_")) {
      const empId = logId;
      await db.insert(auditLogs).values({
        organizationId,
        userId,
        action: `resolve_face_not_registered_${resolutionType}`,
        entity: "employees",
        entityId: empId,
        details: { reason },
      });
      return { success: true };
    }

    const [log] = await db.select().from(attendanceLogs).where(
      and(eq(attendanceLogs.id, logId), eq(attendanceLogs.organizationId, organizationId))
    );

    if (!log) throw new Error("Log not found");

    const currentVersion = log.version ?? 1;
    let updateData: any = {};
    let afterState: any = { ...log };

    if (id.startsWith("MC_") && resolutionType === "suggest_checkout") {
      updateData.checkOutTime = new Date(extraData.checkOutTime);
      updateData.updatedAt = new Date();
      afterState.checkOutTime = updateData.checkOutTime;
    } else if (id.startsWith("OG_") && resolutionType === "adjust") {
      updateData.updatedAt = new Date();
      if (extraData.status) {
         updateData.status = extraData.status;
         afterState.status = extraData.status;
      }
    } else if (resolutionType === "accept" || resolutionType === "keep_original" || resolutionType === "review") {
      updateData.updatedAt = new Date();
    }

    if (Object.keys(updateData).length > 1) {
      await db.update(attendanceLogs)
        .set({ ...updateData, version: currentVersion + 1 })
        .where(eq(attendanceLogs.id, logId));
    }

    await db.insert(attendanceAdjustments).values({
      organizationId,
      attendanceLogId: logId,
      adjustedByUserId: userId,
      type: "RESOLUTION",
      reason,
      before: log,
      after: afterState,
    });

    await db.insert(auditLogs).values({
      organizationId,
      userId,
      action: `resolve_anomaly_${resolutionType}`,
      entity: "attendance_logs",
      entityId: logId,
      details: { reason, logId },
    });

    return { success: true };
  }
}
