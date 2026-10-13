# Aura Attendance V1 — Screen Recording & Product Demo Checklists

## Recording Guidelines

- **Resolution**: 1920x1080 (1080p, 60fps).
- **Audio**: Clear, confident narration focusing on the **business problem and resolution**, not developer clicks.
- **Pacing**: Steady, deliberate mouse movements. Pause 1.5 seconds on key confirmation screens.
- **Environment**: Clean browser window (no bookmark bars or browser extensions). Light / dark mode consistency.
- **Pre-requisite**: Run `npm run seed:demo` before each recording session to reset data to the clean baseline.

---

## 🎬 Video 1: Super Admin & Multi-Tenant Fleet Governance (2–3 mins)

- [ ] **0:00 — Login & Auto-Route**: Login as `admin@platform.aura` / `Demo1234!`. Note immediate landing on `/admin/dashboard`.
- [ ] **0:30 — Fleet Metrics**: Review active organizations, subscription tiers, and global system health indicators.
- [ ] **1:00 — Tenant Provisioning**: Open `/admin/tenants`. Show customer roster. Demonstrate provisioning a new customer organization in 10 seconds.
- [ ] **1:45 — Enter Support Mode**: Click **[Enter Tenant Support Mode]** next to `Bahrain Water Services`.
- [ ] **2:10 — Support Mode Indicator**: Point out the high-visibility `🛡 SUPPORT MODE` top amber banner.
- [ ] **2:30 — Safe Exit**: Click **[Exit Support Mode]** in the top bar. Show immediate return to `/admin/tenants` and verify the audit event in `/admin/audit`.
- [ ] **2:50 — Logout**: Click top-right avatar &rarr; Logout. Verify clean session teardown.

---

## 🎬 Video 2: Tenant Owner Command Center Tour (3–4 mins)

- [ ] **0:00 — Login**: Login as `admin@bahrainwater.com` / `Demo1234!`. Lands on `/dashboard`.
- [ ] **0:25 — 3-Second Operational Check**: Explain the hero grid (*Present Today 84/92, Late Arrivals 4, Missing Checkouts 3, Open Queue 7*).
- [ ] **1:10 — Employee Directory & Profile**: Navigate to `/dashboard/employees`. Search `Ahmed Hassan`. Open edit view to show department, site geofence radius, and biometric status.
- [ ] **2:00 — Geofenced Sites Setup**: Navigate to `/dashboard/sites`. Show Tubli Pumping Station, Sitra Desalination, and Hidd Pumping Station on the map with radius fences.
- [ ] **2:45 — Unified Shell & Search**: Trigger `⌘K` search palette. Show instant navigation to employees and reports.
- [ ] **3:20 — Avatar Profile & Logout**: Open top-right user menu. Show company name, settings, help link, and logout.

---

## 🎬 Video 3: Operations Supervisor Anomaly Resolution (2–3 mins)

- [ ] **0:00 — Morning Anomaly Discovery**: Login as `supervisor@bahrainwater.com`. Open `/dashboard/operations`.
- [ ] **0:30 — Category Filters**: Click through *Missing Checkout*, *GPS Geofence*, and *Biometric & PIN* filter tabs with dynamic counts.
- [ ] **1:00 — Ahmed Hassan Missing Checkout**: Locate Ahmed's unclosed Day 8 punch. Click **[Custom Time]**.
- [ ] **1:30 — Inline Drawer & Compliance Note**: Expand drawer. Set time `17:30`. Type reason: *"Emergency pipeline break repair at Sitra road."* Click **[Confirm Override]**.
- [ ] **2:10 — Geofence Verification**: Navigate to *GPS Geofence* tab. Review offsite technician (230m outside perimeter). Click **[Accept Punch]**.
- [ ] **2:40 — "All Caught Up" Confirmation**: Show empty state confirming attendance records are ready for payroll.

---

## 🎬 Video 4: Biometric Kiosk & Fallback Touch Pad (2–3 mins)

- [ ] **0:00 — Hands-Free Scanner**: Open `/attendance` on tablet kiosk. Show automatic camera start and alignment reticle.
- [ ] **0:30 — Successful Face Punch**: Employee approaches &rarr; Reticle turns green &rarr; 1.2s steady hold &rarr; Celebratory `✓ Checked In` (07:55 AM) with 4s auto-reset.
- [ ] **1:15 — Fallback Trigger**: Present low-light / dust scenario &rarr; Reticle indicates low confidence &rarr; Guidance screen appears.
- [ ] **1:40 — PIN Fallback**: Tap **[Use PIN]**. Enter Employee ID `1042` &rarr; Enter PIN `4821` &rarr; Celebratory `✓ Checked In` with `authMethod: "PIN"`.
- [ ] **2:15 — Security Proof (Rejection)**: Enter invalid PIN 5 times &rarr; Show 30-minute lockout preventing brute force.

---

## 🎬 Video 5: Closed-Loop Leave to Payroll Execution (3–4 mins)

- [ ] **0:00 — Employee Leave Submission**: Submit 2-day Annual Leave for Ahmed Hassan (Sep 12 – Sep 13) at `/dashboard/leave`.
- [ ] **0:45 — Manager Approval**: Login as `manager.ops@bahrainwater.com`. Review balance (`18.0 days remaining`) &rarr; Click **[Approve Request]** &rarr; Balance becomes `16.0`.
- [ ] **1:30 — Attendance Recognition**: Navigate to `/dashboard/attendance` on Sep 12 &rarr; Show Ahmed marked `ON_LEAVE (Paid)` without creating absence errors.
- [ ] **2:15 — End-of-Month Payroll Run**: Login as `payroll@bahrainwater.com` &rarr; open `/dashboard/payroll`. Click **[Calculate Payroll]**.
- [ ] **2:45 — Breakdown & Overtime**: Inspect Ahmed Hassan's line item (20 present + 2 paid leave + 0.5h OT = `$3,865.45`).
- [ ] **3:15 — Approve & Lock**: Click **[Approve Payroll]** &rarr; click **[Lock Payroll Run]**. Show permanent immutability.
- [ ] **3:40 — Printable Payslip**: Open `/dashboard/payroll/payslips/BWS-1042`. Trigger print preview (`Ctrl+P`).

---

## 🎬 Video 6: RBAC & Security Boundary Denials (2–3 mins)

- [ ] **0:00 — Tenant User to Admin**: Logged in as tenant user &rarr; attempt URL `/admin` &rarr; Show **403 Forbidden / Access Denied**.
- [ ] **0:40 — Manager to Payroll Locking**: Logged in as Manager &rarr; attempt to lock payroll run &rarr; Show permission denied error.
- [ ] **1:20 — Cross-Tenant Isolation**: Demonstrate Tenant A token cannot query Tenant B organization data (404 / empty response).
- [ ] **2:00 — Expired Session & Post-Logout**: Navigate to protected dashboard after logout &rarr; Show immediate redirect to `/login`.

---

## 🌟 Flagship Master Video: "A Month in the Life of Bahrain Water Services" (8–12 mins)

Unifies all 6 acts into a seamless narrative following **Ahmed Hassan** and the **Bahrain Water Services management team** from Day 1 to Month-End Payslip.
