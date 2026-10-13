# Operations Supervisor Morning Queue Demo

## Persona
- **User**: Khalid Al-Shamsi (`supervisor@bahrainwater.com`)
- **Role**: `manager` / `supervisor`
- **Focus**: Exception resolution in `/dashboard/operations`

---

## Business Story & Script

### 1. The Morning Challenge
> *"Every morning, field supervisors deal with edge cases: workers who forgot to clock out, workers dispatched to offsite valve stations outside the geofence, or low-light face scans. Rather than hunting through spreadsheets, Aura aggregates everything into an actionable inbox."*

1. Login as `supervisor@bahrainwater.com`
2. Lands on `/dashboard/operations`
3. Point out category tabs with live counts:
   - `3 Missing Checkout`
   - `2 Outside Geofence`
   - `1 Biometric Low Confidence`
   - `1 Duplicate Rapid Punch`

### 2. Resolving a Missing Checkout (Ahmed Hassan)
> *"On Day 8, Ahmed Hassan checked in at 07:58 AM at Tubli Pumping Station but rushed to an emergency main break and forgot to check out."*

1. Click `Missing Checkout` tab
2. Locate Ahmed Hassan (`BWS-1042`):
   - Check-in: `07:58 AM`
   - Check-out: `--:--` (Unclosed session)
   - Expected standard shift end: `17:00`
3. Click **[Custom Time]**:
   - The inline supervisor drawer expands smoothly.
   - Enter Checkout Time: `17:30` (30 minutes overtime for emergency repair)
   - Enter Required Audit Reason: *"Employee was on emergency pipeline break repair at Sitra road until 17:30."*
   - Click **[Confirm Override]**
4. Toast notification: *"Anomaly resolved and audit recorded."*
5. Show item disappearing from queue, updating Ahmed's attendance record with `authenticationMethod: "SUPERVISOR"` and `performedBy: "khalid_id"`.

### 3. Resolving an Outside Geofence Punch
> *"A field technician clocked in 230 meters outside the pumping station perimeter while inspecting an intake valve."*

1. Click `GPS Geofence` tab
2. Locate technician record (showing `230m outside allowed radius`).
3. Click **[Accept Punch]**:
   - Original GPS coordinates and distance remain immutably preserved in `attendance_events`.
   - Attendance status marked as approved with supervisor verification tag.

### 4. Zero-Friction 1-Click Resolves
1. Show pre-calculated shift resolution: click **[Signout 17:00]** on routine unclosed logs.
2. Verify queue status updates to: *"All caught up! There are no unresolved attendance anomalies."*
