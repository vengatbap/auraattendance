# Payroll Processing & Locked Payslips Demo

## Persona
- **User**: Layla Al-Hosani (`payroll@bahrainwater.com`)
- **Role**: `admin` / `payroll_manager`
- **Target URL**: `/dashboard/payroll`

---

## Business Story & Script

### 1. The Payroll Lifecycle: REVIEW $\rightarrow$ CALCULATE $\rightarrow$ APPROVE $\rightarrow$ LOCK
> *"At the end of the monthly pay period (September 2026), Layla initiates the payroll run. Aura computes exact wages down to the cent using verified attendance logs, approved leave days, and overtime."*

1. Open `/dashboard/payroll`
2. Select Pay Period: `September 2026 (01 Sep – 30 Sep)`
3. Status is currently `DRAFT`.

### 2. Live Calculation Engine Run
1. Click **[Calculate Payroll]**:
   - The engine queries:
     - Verified Present Days (from `attendance_logs`)
     - Overtime Hours (e.g. Ahmed's emergency repair on Day 8)
     - Paid Leave Days (Ahmed's 2 days approved leave)
     - Unpaid Absences (0 days for Ahmed)
     - Base Salary and Allowances (from `salary_records`)
2. Inspect calculation breakdown table:
   - **Ahmed Hassan (`BWS-1042`)**:
     - Basic Salary: `$3,200.00`
     - Housing & Transport Allowance: `$600.00`
     - Paid Days: `22 / 22 standard working days` (20 present + 2 paid leave)
     - Overtime (1.5x hourly rate): `$65.45`
     - Deductions: `$0.00`
     - **Net Calculated Pay**: `$3,865.45`

### 3. Review, Approval & Locking
> *"In compliance with strict financial governance, locked payroll runs become completely immutable."*

1. Click **[Approve Payroll]** &rarr; status updates to `APPROVED`.
2. Click **[Lock Payroll Run]**:
   - Status changes to `LOCKED`.
   - All line items are permanently sealed.
   - Any future retrospective attendance adjustments cannot alter this historical run.

### 4. Clean Printable Payslip
> *"Ahmed can immediately view his clean, printable payslip generated using pure browser print CSS without heavyweight external PDF servers."*

1. Click **[View Payslip]** next to Ahmed Hassan (or navigate to `/dashboard/payroll/payslips/BWS-1042`).
2. Show the clean enterprise payslip:
   - Organization: Bahrain Water Services
   - Employee: Ahmed Hassan (`BWS-1042`), Water Distribution Dept
   - Itemized Earnings: Basic Salary, Allowances, Overtime
   - Itemized Deductions & Net Pay: `$3,865.45`
   - Verified stamp & digital watermark.
3. Trigger `Ctrl+P` / `Cmd+P` &rarr; show crisp `@media print` layout ready for PDF or physical print.
