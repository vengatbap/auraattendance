# ADR-004: Attendance Engine

## Status
Accepted

## Date
2026-07-11

## Context
Attendance check-ins and checkouts require geofence compliance, late arrivals tracking, and offline logging synchronization.

## Decision
We implement a robust, server-validated attendance engine:
- **GPS Geofence:** Coordinates must lie within the radius (in meters) of an active site. Distances are calculated server-side using the Haversine distance formula to prevent location spoofing.
- **Late Arrivals:** Checked against tenant configuration (grace period + late limit hours) to mark status as `present` or `late`.
- **Auto-Checkout:** Forgotten check-ins from previous days are lazily updated to closed state at 23:59 if auto-checkout is active.
- **Offline Sync:** Punches recorded during internet downtime are stored locally with tamper-proof client timestamps and queued for automatic synchronization when connectivity returns.

## Consequences
- **Pros:** Prevents time fraud; resilient under poor internet conditions.
- **Cons:** Dependent on client device GPS accuracy.
