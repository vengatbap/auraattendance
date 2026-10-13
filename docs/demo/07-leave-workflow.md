# Closed-Loop Leave Governance Demo

## Overview
Demonstrating how a single leave request flows through **Leave Management $\rightarrow$ Balance Deductions $\rightarrow$ Attendance Recognition $\rightarrow$ Payroll Engine Input**.

---

## Business Story & Script

### 1. The Leave Request
> *"On Day 12, Ahmed Hassan plans a 2-day scheduled annual leave (Sep 12 & Sep 13) for family travel."*

1. Login as `ahmed.hassan@bahrainwater.com` or HR submits on his behalf at `/dashboard/leave`.
2. Select Leave Type: `Annual Leave (Paid)`.
3. Select Date Range: `Sep 12, 2026` to `Sep 13, 2026` (2 working days).
4. Enter Reason: *"Family personal leave."*
5. Submit Request &rarr; Status becomes `PENDING_APPROVAL`.

### 2. Department Manager Review & Approval
> *"Fatima (Operations Manager) reviews the pending request against departmental staffing coverage."*

1. Login as `manager.ops@bahrainwater.com` &rarr; open `/dashboard/leave`.
2. Inspect pending card:
   - Employee: `Ahmed Hassan` (`BWS-1042`)
   - Leave Type: `Annual Leave`
   - Current Balance: `18.0 days remaining`
   - Requested: `2.0 days`
3. Click **[Approve Request]**.
4. System automatically:
   - Deducts balance to `16.0 days`.
   - Stamps audit log with manager ID and timestamp.

### 3. Automatic Linkage to Attendance & Payroll
> *"Because Leave is integrated with Attendance and Payroll, no manual double-entry is needed."*

1. Navigate to `/dashboard/attendance` on `Sep 12`:
   - Ahmed is automatically recognized as `ON_LEAVE (Paid)` rather than generating an `ABSENT` or `MISSING_CHECKOUT` anomaly.
2. In the End-of-Month Payroll Run:
   - The engine includes these 2 days under `Paid Leave Days` in the salary formula.
   - Net pay remains 100% without wrongful absent deductions.
