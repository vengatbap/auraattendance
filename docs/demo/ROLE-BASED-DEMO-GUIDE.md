# Role-Based Product Demo Guide — Aura Attendance V1

This guide provides targeted step-by-step demonstration scripts for each key user persona in Aura Attendance V1.

---

## 1. Platform Super Admin Demo (3 Minutes)
- **Objective:** Demonstrate multi-tenant platform control, tenant provisioning, and secure Support Mode.
- **URL:** `/admin`
- **User:** `admin@aura.io`
- **Key Talking Points:**
  1. Complete isolation between platform oversight and tenant-specific operations.
  2. Live tenant directory showing active subscriptions and usage metrics.
  3. Controlled, audited Support Mode enabling engineers to assist clients with complete audit attribution.

---

## 2. Tenant Admin Demo (5 Minutes)
- **Objective:** Showcase organizational setup, employee directory management, and full configuration.
- **URL:** `/dashboard`
- **User:** `admin@bws.com`
- **Key Talking Points:**
  1. High-level dashboard overview showing live workforce metrics and operational status.
  2. Streamlined employee management with inline CPR identification, site geofencing, and biometric status.
  3. Biometric face enrollment and PIN credential management within a single consolidated edit flow.

---

## 3. Operations Supervisor Demo (4 Minutes)
- **Objective:** Demonstrate the morning triage workflow and rapid anomaly resolution.
- **URL:** `/dashboard/operations`
- **User:** `sup@bws.com`
- **Key Talking Points:**
  1. The "Morning Coffee" workflow: Zero-click immediate visibility into attendance exceptions.
  2. Smart resolution workflows for missing checkouts, geofence breaches, and biometric mismatches.
  3. Enforced audit logging: Every supervisor adjustment requires a mandatory business justification.

---

## 4. Manager Leave Management Demo (3 Minutes)
- **Objective:** Demonstrate real-time leave request approval and automated balance deductions.
- **URL:** `/dashboard/leave`
- **User:** `mgr@bws.com`
- **Key Talking Points:**
  1. Unified pending leave queue with real-time balance calculations.
  2. One-click approval and audited rejection with reason logging.
  3. Automatic synchronization with payroll calculation engines.

---

## 5. Payroll & Finance Officer Demo (5 Minutes)
- **Objective:** Demonstrate automated payroll runs, integer financial precision, immutable locking, and printable payslips.
- **URL:** `/dashboard/payroll`
- **User:** `pay@bws.com`
- **Key Talking Points:**
  1. Strict state machine progression: Draft $\rightarrow$ Calculating $\rightarrow$ Review $\rightarrow$ Approved $\rightarrow$ Locked.
  2. Zero floating-point rounding errors: Financial calculations executed in exact integer cents (BHD).
  3. Immutability guarantee: Once locked, payroll runs cannot be altered without a formal revision audit.
  4. Native browser-printable payslip rendering.
