# Attendance Module

## Purpose
Maintains core check-in and checkout records, validating punches via webcam biometrics similarity and GPS coordinates geofencing.

## Business Rules
- **Biometric threshold:** cosine similarity score must match or exceed org settings (default 0.6).
- **Geofence bounds:** checks that coordinates lie inside the active site radius using the Haversine formula.
- **Punch Gap:** Consecutive punches by an employee must be separated by the Gap configuration (default 30 minutes) to prevent duplicates.
- **Auto-Checkout:** Older open check-ins are automatically closed at `23:59`.

## API
- `POST /api/attendance/punch` - Receive webcam embedding hash + GPS coordinates and record check-in/checkout.
- `GET /api/attendance` - Query logs filterable by date, status, employee.
- `PUT /api/attendance/adjust` - Record a manual override with audit log details.

## Components
- `KioskScanner` - Screen capturing canvas.
- `LivePunchFeed` - Realtime list widget.
- `AttendanceTable` - Ledger view.
- `OperationsInbox` - Queue checklist of anomalies (missing checkout, outside geofence, duplicate).

## Dependencies
- `drizzle-orm` (database adapter)
- `@vladmandic/face-api` (client landmarks)

## Future Scope (V2)
- Biometric hardware card integrations.
- QR code card scans fallback.
