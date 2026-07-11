# Attendance Engine

This document defines exactly how the check-in and checkout validation flow operates in Aura Attendance.

## 1. Core Verification Sequence

```text
Employee requests check-in (webcam capture + GPS request)
  ↓
1. Face Landmark Extraction
   - Client scans landmark face grid.
   - Rejects punch if face is misaligned, lighting is poor, or template cannot be generated.
  ↓
2. Server Embedding cosine similarity matching
   - Compares query vector hash against organization templates.
   - Rejects if similarity < threshold settings (default 0.6).
  ↓
3. GPS Geofence Check
   - Compares coordinates against sites bounds using Haversine calculation.
   - Rejects if employee distance > site radius (unless allowed globally).
  ↓
4. Punch Log state check
   - Queries if log exists for the employee on the current date.
   - NO  → Record CHECK-IN.
   - YES → Record CHECK-OUT (overwriting previous checkout if multiple allowed).
```

---

## 2. Business Logic Rules

### Grace Period
- Standard shift start is defined on the organization (e.g. `09:00`).
- If check-in time > standard start + grace period minutes (default 15 minutes), the log is status-flagged as `late`. Otherwise, status is `present`.

### Duplicate Punch Gap
- Prevent accidental double check-ins. If the difference between the current time and the last recorded check-in/checkout is less than the GAP configuration (default 30 minutes), the request is rejected with a conflict error.

### Auto-Checkout
- If enabled, when an employee punches in the next day but has an open check-in from a previous date, the server automatically closes the old punch, setting its checkout time to `23:59`.

### Outside Radius
- Logs checked in outside the site radius are flagged as `outside_radius`. The administrator is notified on the issues page to review or override the punch status.

### Low Biometric Confidence
- If a face match succeeds but falls within a warning buffer (e.g., between `0.6` and `0.75`), the log is saved but marked as `low_confidence` for administrator audit.

### Offline Queue
- Client caches punches in LocalStorage when offline.
- Upon reconnection, punches are synced. The server trusts the cached client timestamp but cross-references it with network check times to detect tampering.
