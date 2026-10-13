# Master Product Demo Recording Script (E2E Master Workflow)

> **Scenario**: "A Day in the Life of Bahrain Water Services"  
> **Tenant**: Bahrain Water Services (`bws`)  
> **Narrator Role**: Workforce Operations Director / Solutions Architect  
> **Estimated Duration**: 10 – 12 minutes  

---

## Recording Scene Index & Cue Sheet

```text
                               MASTER DEMO WORKFLOW
                                         │
        ┌────────────────────────────────┼────────────────────────────────┐
        │                                │                                │
  PLATFORM CONTROL               KIOSK OPERATIONS              EXCEPTIONS & PAYROLL
   (Scenes 01–03)                 (Scenes 04–08)                  (Scenes 09–18)
        │                                │                                │
┌───────┴───────┐                ┌───────┴───────┐                ┌───────┴───────┐
│ Super Admin   │                │ Face Reticle  │                │ Operations Hub│
│ Support Mode  │                │ PIN Fallback  │                │ Leave Approval│
│ Tenant Shell  │                │ Live Sync     │                │ Locked Payroll│
└───────────────┘                └───────────────┘                └───────────────┘
```

---

### Scene 01 — Platform Control Plane (`/admin`)
- **Visual**: Login as `superadmin@aura.io`. Land on the dark high-density Super Admin Control Plane.
- **Narration**: *"Aura Attendance strictly separates global platform multi-tenancy from enterprise tenant workspaces. Here in the Platform Control Plane, platform administrators manage SaaS tenants, subscription tiers, and system-wide telemetry."*
- **Action**: Click **Organizations** &rarr; Filter for *Bahrain Water Services*.

### Scene 02 — Super Admin Enters Support Mode
- **Visual**: Click **Enter Support Mode** on Bahrain Water Services. High-contrast amber top strip appears: `🛡 SUPPORT MODE: Viewing as Bahrain Water Services [Exit Support Mode]`.
- **Narration**: *"When troubleshooting tenant issues, support personnel explicitly enter impersonation mode with persistent visual attribution and compliant audit logging."*

### Scene 03 — Tenant Workspace Command Center (`/dashboard`)
- **Visual**: Show the Tenant Admin Dashboard. Highlight 4 hero metric cards (*Present Today*, *Late Arrivals*, *Missing Checkout*, *Unresolved Anomalies*).
- **Narration**: *"The Tenant Command Center provides an instant 3-second overview of workforce health: Who is here? Who is late? And what anomalies require immediate attention before payroll?"*

### Scene 04 — Employee Directory & Biometric Vector Privacy (`/dashboard/employees`)
- **Visual**: Open Employees page. Show Ahmed Hassan (`BWS-1042`), Mariam Al-Hashimi (`BWS-1043`), and team. Show *Face Enrolled: Yes* badge.
- **Narration**: *"Aura stores one-way 128-dimensional Euclidean mathematical vectors. Raw facial images and biometric descriptors are never transmitted to browser clients."*

### Scene 05 — The Biometric Kiosk (`/attendance`)
- **Visual**: Switch to Kiosk view (1280x800 tablet layout). Camera starts automatically. Corner reticles pulse emerald.
- **Narration**: *"The Kiosk opens directly into hands-free Face Recognition mode. An employee simply walks up to the device."*

### Scene 06 — Normal Face Punch (Ahmed Hassan)
- **Visual**: Camera locks onto Ahmed Hassan. Hold for 1.2s &rarr; Emerald checkmark ring &rarr; *"Verified! Ahmed Hassan — Field Engineer. Checked in at 07:55 AM"*.
- **Narration**: *"Biometric identification occurs in sub-second time. Geofence coordinates and site perimeters are validated on the server."*

### Scene 07 — Biometric Edge Condition (Low Confidence)
- **Visual**: Deliberate low-light / obstruction &rarr; Yellow reticle &rarr; *"Face could not be verified. Tap PIN to continue"*.
- **Narration**: *"When environmental stress or PPE prevents a confident facial match, the kiosk gracefully offers a 1-tap PIN fallback."*

### Scene 08 — PIN Fallback Punch (Omar Al-Qubaisi)
- **Visual**: Tap **Use PIN** &rarr; Enter Code `1046` + PIN `4821` &rarr; Verified punch screen.
- **Narration**: *"The employee enters their code and secure PIN. PIN punches enforce the same geofence, shift, and duplicate punch rules as biometric scans."*

### Scene 09 — Operations Hub Work Queue (`/dashboard/operations`)
- **Visual**: Open `/dashboard/operations`. Show the categorized anomaly inbox (*1 Missing Checkout*, *1 Outside Geofence*).
- **Narration**: *"Every morning, operations supervisors don't sift through spreadsheets. The Operations Hub surfaces unclosed shifts, geofence violations, and offline syncs."*

### Scene 10 — Supervisor Anomaly Resolution
- **Visual**: Click on Yousef Al-Shamsi's *Missing Checkout* item &rarr; Select *Suggest Checkout: 17:30* &rarr; Enter reason: *"Emergency pipeline repair"* &rarr; Click **Resolve**.
- **Narration**: *"Supervisors resolve exceptions with mandatory audit reasons. Before/after state snapshots are immutably archived."*

### Scene 11 — Leave Management & Approval (`/dashboard/leave`)
- **Visual**: Open `/dashboard/leave`. Show Aisha Al-Dhaheri's 2-day Annual Leave request.
- **Narration**: *"Leave governance is closed-loop. Manager approves Aisha's request &rarr; balance updates immediately from 18 to 16 days &rarr; attendance engine flags the scheduled days."*
- **Action**: Click **Approve**. Show real-time balance reduction.

### Scene 12 — Payroll Period & Batch Calculation (`/dashboard/payroll`)
- **Visual**: Open `/dashboard/payroll`. Show September 2026 Monthly Run. Click **Calculate Payroll**.
- **Narration**: *"Payroll calculations execute in chunked batches across attendance and leave summaries. All monetary calculations use exact BigInt cent arithmetic with zero floating-point rounding errors."*

### Scene 13 — Payroll Review & Financial Breakdown
- **Visual**: Open Run Review table. Show Ahmed Hassan ($3,200.00 basic + $600.00 allowances = $3,800.00), Dana Al-Habsi with 1.5h overtime, and Sami Al-Neyadi with unpaid absence deductions.
- **Narration**: *"Every calculation breakdown is transparent and auditable down to the cent."*

### Scene 14 — Approval, Payment & Permanent Lock
- **Visual**: Click **Approve Run** &rarr; Click **Mark Paid** &rarr; Click **Lock Payroll**.
- **Narration**: *"Once locked, the payroll run becomes permanently immutable. Recalculation attempts are strictly blocked by the state machine."*

### Scene 15 — Individual Printable Payslip
- **Visual**: Click **View Payslip** for Ahmed Hassan. Clean A4 printable sheet with company header, earnings, overtime, deductions, and net pay.
- **Narration**: *"Locked runs generate compliant printable payslips formatted for standard A4 and browser PDF export."*

### Scene 16 — Reports & Compliance Audit Exports (`/dashboard/reports`)
- **Visual**: Open Reports page. Click **Export Attendance CSV** and **Export Payroll Summary CSV**.
- **Narration**: *"Management exports clean CSV summaries for ERP integration and regulatory compliance."*

### Scene 17 — Exit Support Mode & Session Guard
- **Visual**: Click **Exit Support Mode** in top bar &rarr; Return immediately to Super Admin Control Plane.
- **Narration**: *"With one click, platform administrators exit support mode, returning to global control while preserving all audit attributions."*

### Scene 18 — Logout & Sign-Off
- **Visual**: Click Avatar &rarr; **Sign Out** &rarr; Clean redirect to `/login`.
- **Narration**: *"Aura Attendance: Complete workforce visibility, hands-free biometric reliability, and cent-exact payroll integration."*
