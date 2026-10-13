# Hardening Step 4 — Cross-Module Reconciliation Report

## Mathematical & Workflow Reconciliation Audit

```text
Attendance Engine (Punches & Overrides)
           │
           ▼
Operations Hub (Adjustments & Exceptions)
           │
           ▼
Final Validated Attendance + Leave Balances
           │
           ▼
Payroll Engine (Batch BigInt Calculation)
           │
           ▼
Frozen Locked Run & Payslips
           │
           ▼
Management CSV Reports
```

---

## 1. Employee-by-Employee Financial Reconciliation

All monetary calculations use `MoneyService` integer arithmetic (BigInt cents) based on 22 working days in September 2026:

| Employee Code & Name | Role | Scheduled Days | Present Days | Approved Paid Leave | Unpaid Absences | Overtime Hours | Basic Salary | Allowances | Overtime Pay | Unpaid Deductions | Net Salary |
|---|---|---|---|---|---|---|---|---|---|---|---|
| `BWS-1042` Ahmed Hassan | Field Engineer | 22 | 22 | 0 | 0 | 0.0h | BHD 3,200.00 | BHD 0.00 | BHD 0.00 | BHD 0.00 | **BHD 3,200.00** |
| `BWS-1043` Mariam Al-Hashimi | Water Chemist | 22 | 22 | 0 | 0 | 0.0h | BHD 3,400.00 | BHD 0.00 | BHD 0.00 | BHD 0.00 | **BHD 3,400.00** |
| `BWS-1044` Yousef Al-Shamsi | Mech Tech (Resolved) | 22 | 22 | 0 | 0 | 0.0h | BHD 2,900.00 | BHD 0.00 | BHD 0.00 | BHD 0.00 | **BHD 2,900.00** |
| `BWS-1045` Noura Al-Marzouqi | SCADA Specialist | 22 | 22 | 0 | 0 | 0.0h | BHD 3,100.00 | BHD 0.00 | BHD 0.00 | BHD 0.00 | **BHD 3,100.00** |
| `BWS-1046` Omar Al-Qubaisi | Electrical Engineer (PIN) | 22 | 22 | 0 | 0 | 0.0h | BHD 3,500.00 | BHD 0.00 | BHD 0.00 | BHD 0.00 | **BHD 3,500.00** |
| `BWS-1047` Aisha Al-Dhaheri | Safety Officer (Leave) | 22 | 20 | 2 | 0 | 0.0h | BHD 2,800.00 | BHD 0.00 | BHD 0.00 | BHD 0.00 | **BHD 2,800.00** |
| `BWS-1048` Sami Al-Neyadi | Pipeline Tech (Absent) | 22 | 20 | 0 | 2 | 0.0h | BHD 2,600.00 | BHD 0.00 | BHD 0.00 | BHD 236.36 | **BHD 2,363.64** |
| `BWS-1049` Dana Al-Habsi | Valve Inspector (OT) | 22 | 22 | 0 | 0 | 1.5h | BHD 2,750.00 | BHD 0.00 | BHD 28.16 | BHD 0.00 | **BHD 2,778.16** |

---

## 2. Invariance Verification Checks

- [x] **Attendance Invariance**: Total present days in `attendance_logs` (including supervisor-resolved checkouts) equal the input days consumed by `PayrollEngine`.
- [x] **Leave Invariance**: Aisha's 2 approved annual leave days are counted as paid days; balance in `leave_balances` reduced from $22.0 \rightarrow 16.0$ ($22 - (4 + 2)$).
- [x] **Deduction Invariance**: Sami's 2 unexcused absent days are pro-rated ($2,600 \div 22 \times 2 = 236.36$) and subtracted from gross pay.
- [x] **Payslip Invariance**: Every generated payslip record in `payslips` matches the exact net pay line item in `payroll_items`.
- [x] **Immutability Invariance**: Attempting to recalculate a `LOCKED` run is rejected by `PayrollEngine` with error `INVALID_RUN_STATE`.
