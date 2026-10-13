# Aura Attendance — Product Demonstration Architecture (V1)

## Executive Summary

Aura Attendance is a multi-tenant enterprise Workforce Operations & Attendance platform built for modern organizations. It unifies **biometric camera kiosks, geofenced mobile check-ins, operational anomaly resolution, leave governance, and closed-loop payroll processing**.

```text
                                  AURA PLATFORM
                                        │
             ┌──────────────────────────┴──────────────────────────┐
             │                                                     │
      PLATFORM CONTROL                                      TENANT WORKSPACE
          (/admin)                                             (/dashboard)
             │                                                     │
       Super Admin                                            Tenant Admin
                                                                   │
                                 ┌─────────────────┬───────────────┴───────────────┐
                                 │                 │                               │
                              Manager          Supervisor                       Payroll / HR
                                 │                 │                               │
                                 └─────────────────┴───────────────┬───────────────┘
                                                                   │
                                                            ATTENDANCE KIOSK
                                                              (/attendance)
                                                                   │
                                                                Employee
```

---

## The Role Hierarchy & Security Model

| Role | Primary Responsibility | Workspace | Typical Operations |
|---|---|---|---|
| **Super Admin** | Platform Governance & Multi-Tenant Fleet | `/admin` | Tenant provisioning, feature flag rollout, system audit, tenant support mode impersonation |
| **Tenant Admin** | Organization Ownership & Setup | `/dashboard` | Department/site setup, employee directory, kiosk configuration, company settings, user invites |
| **Operations Supervisor** | Daily Attendance Exception Handling | `/dashboard/operations` | Resolving missing checkouts, reviewing out-of-geofence punches, biometric flags, supervisor overrides |
| **Department Manager** | Team Governance & Leave | `/dashboard/leave` | Viewing team logs, approving/rejecting leave requests with comments, shift adjustments |
| **Payroll Manager** | Financial Execution & Payslips | `/dashboard/payroll` | Reviewing work hours, unpaid deductions, calculating runs, approving, locking, and issuing payslips |
| **Employee** | Daily Clock In / Out | `/attendance` | Face recognition punch, PIN fallback punch, attendance verification |

---

## Demo Script Index

The demo scripts in this suite are organized by persona and business workflow:

- [`01-super-admin.md`](./01-super-admin.md) — Multi-tenant fleet management & Platform Control Plane.
- [`02-tenant-admin.md`](./02-tenant-admin.md) — Organization setup, employee directory, face registration, and site geofences.
- [`03-manager-rbac.md`](./03-manager-rbac.md) — Permission boundaries, team visibility, and leave management.
- [`04-supervisor-operations.md`](./04-supervisor-operations.md) — Morning exception queue resolution before payroll.
- [`05-employee-attendance.md`](./05-employee-attendance.md) — Kiosk face recognition clock-in and out.
- [`06-face-to-pin-fallback.md`](./06-face-to-pin-fallback.md) — Camera failure / low-confidence fallback to Employee Code + PIN.
- [`07-leave-workflow.md`](./07-leave-workflow.md) — Leave request $\rightarrow$ approval $\rightarrow$ balance deduction $\rightarrow$ attendance log linkage.
- [`08-payroll-workflow.md`](./08-payroll-workflow.md) — Calculation from attendance logs & leave $\rightarrow$ approval $\rightarrow$ lock $\rightarrow$ payslip generation.
- [`09-reports-audit.md`](./09-reports-audit.md) — Raw CSV data exports and immutable audit trails.
- [`10-support-mode.md`](./10-support-mode.md) — Super Admin entering tenant support mode with full audit attribution and 1-click exit.
- [`11-full-e2e-master-scenario.md`](./11-full-e2e-master-scenario.md) — **The Master Flagship Storyline** (*Bahrain Water Services & Ahmed Hassan*).
