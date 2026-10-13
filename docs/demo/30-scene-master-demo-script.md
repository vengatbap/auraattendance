# 30-Scene Master Demo Script — Aura Attendance V1

## Scene 01–05: Platform Administration & Super Admin Experience
- **Scene 01:** Super Admin logs in at `/login` with platform credentials (`admin@aura.io`).
- **Scene 02:** System redirects to `/admin` platform control center; verify tenant isolation.
- **Scene 03:** Super Admin inspects Organizations list, selecting "Bahrain Water Services".
- **Scene 04:** Super Admin clicks "Support Mode: Enter Tenant Workspace" to assist customer.
- **Scene 05:** Amber Support Mode banner appears with session dual-attribution. Super Admin navigates tenant workspace and exits safely back to `/admin`.

## Scene 06–10: Tenant Administration & Employee Onboarding
- **Scene 06:** Tenant Admin logs in with `admin@bws.com` and arrives at `/dashboard`.
- **Scene 07:** Admin navigates to `/dashboard/employees` displaying unified grid with active and face enrollment statuses.
- **Scene 08:** Admin clicks "+ Add Employee", fills basic info, CPR number, designation, and assigns site.
- **Scene 09:** Admin configures Salary Settings (BHD 3,200/mo, 22 working days, 1.5x overtime).
- **Scene 10:** Admin initiates Face Enrollment using built-in webcam capture and sets fallback 4-digit PIN.

## Scene 11–15: Kiosk Experience & Biometric Attendance
- **Scene 11:** Launch Attendance Kiosk at `/attendance` on mounted tablet.
- **Scene 12:** Employee A steps into frame; camera detects face, verifies biometric vector, and flashes green check-in confirmation within 400ms.
- **Scene 13:** Employee B attempts check-in under poor lighting; system cleanly offers "Switch to PIN Fallback".
- **Scene 14:** Employee B enters Employee Code + 4-digit PIN; system confirms check-in.
- **Scene 15:** Employee attempts check-in from outside Tubli Station geofence perimeter; system flags punch with `OUTSIDE_GEOFENCE` while preserving record.

## Scene 16–20: Supervisor Morning Operations Hub
- **Scene 16:** Supervisor logs in and accesses `/dashboard/operations` morning triage queue.
- **Scene 17:** Anomaly queue displays categorized badges: Missing Checkout, Outside Geofence, Face Not Registered.
- **Scene 18:** Supervisor clicks "Suggest Checkout" on Employee C's missing evening punch, verifies timestamp, enters required reason ("Confirmed departure on site log"), and resolves.
- **Scene 19:** Supervisor reviews geofence flag for Employee D, checks GPS coordinates, and accepts with audited justification.
- **Scene 20:** Verification badge decrements to 0; queue shows clean "All Operations Verified" empty state.

## Scene 21–25: Leave Management Workflow
- **Scene 21:** Employee submits 2-day Annual Leave request for September 14–15.
- **Scene 22:** Manager opens `/dashboard/leave` viewing unified Pending Requests drawer.
- **Scene 23:** Manager inspects employee leave balance (22 days allocated, 4 used, 18 remaining).
- **Scene 24:** Manager clicks "Approve"; system automatically updates balance to 16 days.
- **Scene 25:** Leave record transitions to approved state with timestamped audit entry.

## Scene 26–30: Payroll Calculation, Locking & Payslip Generation
- **Scene 26:** Payroll Officer navigates to `/dashboard/payroll` and creates September 2026 Monthly Payroll Run.
- **Scene 27:** Officer clicks "Calculate"; engine loads verified attendance logs, approved leaves, and salary parameters.
- **Scene 28:** Officer reviews itemized summary: Basic Salary, Overtime, Paid Leave, Deductions, and Net Salary calculated in exact BHD cents.
- **Scene 29:** Officer clicks "Approve" and then "Lock Payroll Run"; state machine permanently locks run (subsequent re-calculations blocked).
- **Scene 30:** Officer clicks "Generate Payslips"; printable payslip view rendered via clean browser print CSS ready for export and distribution.
