import { NextRequest, NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { attendanceLogs, employees, sites } from "@/db/schema";
import { attendancePunchSchema } from "@/validators/attendance.validator";
import { faceRepository } from "@/repositories/face.repository";
import { haversineDistance, matchEmbedding, toDateString } from "@/utils";

export async function POST(req: NextRequest) {
  try {
    const parsed = attendancePunchSchema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues }, { status: 400 });
    }

    const input = parsed.data;
    const activeSites = await db.select().from(sites).where(eq(sites.status, "active"));
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
      ? { ...matchedSite, matched: true }
      : {
          id: null,
          name: "Unknown location",
          matched: false,
          nearestSiteName: nearest?.site.name ?? null,
        };

    const profiles = await faceRepository.getAllEmbeddings();
    const match = matchEmbedding(
      input.descriptor,
      profiles.map((profile) => ({
        employeeId: profile.employeeId,
        embedding: profile.embedding as number[],
      }))
    );

    if (!match) {
      return NextResponse.json({ matched: false, error: "Face not recognized" }, { status: 404 });
    }

    const [employee] = await db
      .select()
      .from(employees)
      .where(and(eq(employees.id, match.employeeId), eq(employees.status, "active")))
      .limit(1);

    if (!employee) {
      return NextResponse.json({ matched: false, error: "Active employee not found" }, { status: 404 });
    }

    // Employee can now punch in at any valid site.
    // if (matchedSite && employee.siteId && employee.siteId !== matchedSite.id) {
    //   return NextResponse.json({ error: "Employee is not assigned to this site" }, { status: 403 });
    // }

    const today = toDateString();
    const [existing] = await db
      .select()
      .from(attendanceLogs)
      .where(and(eq(attendanceLogs.employeeId, employee.id), eq(attendanceLogs.date, today)))
      .limit(1);

    const ipAddress =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
      req.headers.get("x-real-ip") ??
      null;

    if (!existing) {
      const hour = new Date().getHours();
      const [log] = await db
        .insert(attendanceLogs)
        .values({
          organizationId: employee.organizationId ?? matchedSite?.organizationId ?? null,
          employeeId: employee.id,
          siteId: matchedSite?.id ?? null,
          date: today,
          checkInTime: new Date(),
          status: hour >= 9 ? "late" : "present",
          confidenceScore: match.score,
          gpsDistanceMeters: distance,
          gpsLatitude: input.latitude,
          gpsLongitude: input.longitude,
          photoUrl: input.photo,
          deviceInfo: input.deviceInfo,
          browser: input.browser,
          ipAddress,
          punchType: "in",
        })
        .returning();

      return NextResponse.json({
        action: "check_in",
        matched: true,
        employee,
        site: siteResult,
        attendanceLog: log,
        faceScore: match.score,
        distanceMeters: distance,
        locationMatched: Boolean(matchedSite),
        latitude: input.latitude,
        longitude: input.longitude,
      });
    }

    if (existing.checkOutTime) {
      return NextResponse.json({
        action: "already_checked_out",
        matched: true,
        employee,
        site: siteResult,
        attendanceLog: existing,
        faceScore: match.score,
        distanceMeters: distance,
        locationMatched: Boolean(matchedSite),
        latitude: input.latitude,
        longitude: input.longitude,
      });
    }

    const [log] = await db
      .update(attendanceLogs)
      .set({
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
        updatedAt: new Date(),
      })
      .where(eq(attendanceLogs.id, existing.id))
      .returning();

    return NextResponse.json({
      action: "check_out",
      matched: true,
      employee,
      site: siteResult,
      attendanceLog: log,
      faceScore: match.score,
      distanceMeters: distance,
      locationMatched: Boolean(matchedSite),
      latitude: input.latitude,
      longitude: input.longitude,
    });
  } catch (error) {
    console.error("Punch error:", error);
    return NextResponse.json({ error: "Failed to save attendance" }, { status: 500 });
  }
}
