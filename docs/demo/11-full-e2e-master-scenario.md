# Master Flagship E2E Demo Scenario

## "A Month in the Life of Bahrain Water Services"

### The Cast & Story Arc

```text
Company:   Bahrain Water Services (92 employees across 3 pumping stations)
Hero:      Ahmed Hassan (Employee Code: BWS-1042, Field Maintenance Engineer)
Roles:     
  ├─ Ahmed Hassan (Worker)
  ├─ Tariq Al-Mansoor (Tenant Admin)
  ├─ Fatima Al-Zaabi (Operations Manager)
  ├─ Khalid Al-Shamsi (Field Supervisor)
  ├─ Layla Al-Hosani (Payroll Officer)
  └─ Alex Morgan (Platform Super Admin)
```

---

## The 6-Stage Master Timeline

```text
  DAY 1                  DAY 5                  DAY 8/9                DAY 12                 DAY 30
┌──────────────┐       ┌──────────────┐       ┌──────────────┐       ┌──────────────┐       ┌──────────────┐
│ Face Check-in│  ───► │ PIN Fallback │  ───► │ Forgets Out  │  ───► │ Leaves 2 Days│  ───► │   PAYROLL    │
│   (Kiosk)    │       │ (Harsh Sun)  │       │ Supervisor   │       │ Manager OK   │       │ Calculated   │
│              │       │              │       │  Resolves    │       │ Auto-Linked  │       │ Locked+Slip  │
└──────────────┘       └──────────────┘       └──────────────┘       └──────────────┘       └──────────────┘
```

---

### ACT 1: Day 1 — Automated Biometric Check-In (Kiosk)
1. **Scene**: 07:55 AM, Tubli Pumping Station.
2. **Action**: Ahmed approaches the mounted tablet kiosk (`/attendance`).
3. **Outcome**:
   - Camera detects Ahmed's face $\rightarrow$ green reticle locks on.
   - 1.2-second steady hold $\rightarrow$ verified.
   - Large green checkmark `✓ Checked In`, `Ahmed Hassan`, `07:55 AM`.
   - Screen resets automatically after 4 seconds for the next worker.

---

### ACT 2: Day 5 — Biometric Fallback to PIN (PPE / Dust)
1. **Scene**: 07:58 AM, harsh sand glare and protective safety visor reduce face match confidence.
2. **Action**:
   - Kiosk displays: *"Face could not be verified with confidence. Please try again or use PIN."*
   - Ahmed taps **[Use PIN]**.
   - Step 1: Enters Employee ID `1042` &rarr; taps **Next**.
   - Step 2: Enters PIN `4821` &rarr; taps **Submit**.
3. **Outcome**:
   - System authenticates against bcrypt hash.
   - `✓ Checked In` at `07:58 AM` recorded with `authMethod: "PIN"`.

---

### ACT 3: Day 8 & 9 — Missing Checkout & Supervisor Resolution
1. **Scene**: On Day 8, Ahmed is dispatched to an emergency main break at Sitra road and forgets to punch out.
2. **Scene**: Day 9, 07:30 AM — Supervisor Khalid opens `/dashboard/operations`.
3. **Action**:
   - Khalid sees `3 Missing Checkout` anomalies in his inbox.
   - Locates Ahmed's Day 8 unclosed session.
   - Clicks **[Custom Time]** &rarr; enters `17:30` (30 min overtime for emergency repair).
   - Enters Required Compliance Reason: *"Employee was on emergency pipeline break repair at Sitra road until 17:30."*
   - Clicks **[Confirm Override]**.
4. **Outcome**:
   - Queue drops to 2 anomalies.
   - Ahmed's attendance is corrected and stamped with `performedBy: "khalid_id"` and `authMethod: "SUPERVISOR"`.

---

### ACT 4: Day 12 — Closed-Loop Leave Governance
1. **Scene**: Ahmed requests 2 days scheduled annual leave (Sep 12 & Sep 13) for family travel.
2. **Action**:
   - Manager Fatima logs into `/dashboard/leave`.
   - Inspects Ahmed's request (`18.0 days remaining`).
   - Clicks **[Approve Request]**.
3. **Outcome**:
   - Ahmed's balance updates to `16.0 days`.
   - On Sep 12 & 13, the Attendance Engine marks him `ON_LEAVE` (no absence flags generated).
   - Payroll automatically receives 2 paid leave days.

---

### ACT 5: End of Month — Payroll Processing, Locking & Payslips
1. **Scene**: Sep 30, Payroll Officer Layla opens `/dashboard/payroll`.
2. **Action**:
   - Selects `September 2026 Run` &rarr; Clicks **[Calculate Payroll]**.
   - The engine aggregates:
     - Basic Salary: `$3,200.00`
     - Allowances: `$600.00`
     - 20 Present Days + 2 Paid Leave Days = 22 Days (Full Base Pay)
     - Overtime (0.5 hrs @ 1.5x): `$65.45`
     - Net Pay: `$3,865.45`
   - Layla clicks **[Approve Payroll]** &rarr; then **[Lock Payroll Run]**.
3. **Outcome**:
   - Run is permanently sealed and immutable (`LOCKED`).
   - Ahmed opens `/dashboard/payroll/payslips/BWS-1042` and views his verified, printable payslip with clean `@media print` layout.

---

### ACT 6: Platform Support Mode Demonstration
1. **Scene**: Alex Morgan (Platform Super Admin) logs into `/admin`.
2. **Action**:
   - Enters Support Mode for `Bahrain Water Services`.
   - Amber alert strip `🛡 SUPPORT MODE` confirms active tenant context.
   - Alex reviews the finalized September metrics.
   - Clicks **[Exit Support Mode]** &rarr; returns safely to Platform Control Plane.

---

## Summary of Reusable Test Data

| Attribute | Value |
|---|---|
| **Organization Name** | `Bahrain Water Services` |
| **Organization Slug** | `bws` |
| **Tenant Admin** | `admin@bahrainwater.com` |
| **Department Manager** | `manager.ops@bahrainwater.com` |
| **Field Supervisor** | `supervisor@bahrainwater.com` |
| **Payroll Officer** | `payroll@bahrainwater.com` |
| **Key Employee** | `Ahmed Hassan` (Code: `BWS-1042`) |
| **Enrolled PIN** | `4821` |
| **Assigned Site** | `Tubli Pumping Station` |
| **Standard Salary** | `$3,200.00` Base + `$600.00` Allowances |
