# Raw Data Exports & Compliance Audit Demo

## Persona
- **User**: Compliance Officer / Auditor
- **Organization**: Bahrain Water Services
- **Target URL**: `/dashboard/reports` & `/dashboard/audit-logs`

---

## Business Story & Script

### 1. Minimalist Data Exports (`/dashboard/reports`)
> *"Aura eliminates bloated custom chart builders in favor of fast, clean, standard CSV data exports."*

1. Navigate to `/dashboard/reports`.
2. Three primary export cards are presented:
   - **Attendance Export**: Filter by date range, department, site.
   - **Leave Ledger Export**: Summary of all approved, rejected, and balance carryovers.
   - **Payroll Summary Export**: Line-item breakdown of net pay, overtime, and deductions.
3. Click **[Export CSV]** on Attendance &rarr; downloads structured CSV in under 200ms.

### 2. Tenant Compliance Audit Log (`/dashboard/audit-logs`)
> *"Every single supervisor override, leave approval, and payroll state transition writes an immutable audit record."*

1. Navigate to `/dashboard/audit-logs`.
2. Inspect entries from our demo workflow:
   - `ATTENDANCE_OVERRIDE`: Actor `khalid_id`, Employee `Ahmed Hassan`, Reason: *"Employee was on emergency pipeline break repair..."*
   - `LEAVE_APPROVED`: Actor `fatima_id`, Employee `Ahmed Hassan`, Days: 2.0
   - `PAYROLL_LOCKED`: Actor `layla_id`, Period: Sep 2026, Total: `$354,210.00`
3. Highlight that audit logs are append-only.
