# Hardening Step 4 — Defect Log

## Defect Triage & Resolution Matrix

| Defect ID | Component | Description | Root Cause | Resolution Applied | Verification Status |
|---|---|---|---|---|---|
| **DEF-01** | `LeaveService` | `db.transaction()` throwing `No transactions support in neon-http driver` | Neon Serverless HTTP driver does not support interactive transactions over HTTP | Replaced `db.transaction` with direct sequential operations on `db` | ✅ **PASS (Verified)** |
| **DEF-02** | `PayrollEngine` | `db.transaction()` failure on batch insertion | Neon Serverless HTTP driver constraint | Executed repository delete and insert directly on `db` | ✅ **PASS (Verified)** |
| **DEF-03** | `PayrollService` | `lockRun` transaction failure during payslip batch creation | Neon Serverless HTTP driver constraint | Executed status updates and payslip batch insertion directly on `db` | ✅ **PASS (Verified)** |
| **DEF-04** | `PayrollEngine` | Return value of `calculateRun` was undefined | Missing return statement in `calculateRun` try block | Added `return await PayrollRunRepository.findById(runId, organizationId);` | ✅ **PASS (Verified)** |
| **DEF-05** | `PayrollEngine` | Double deduction of unpaid leave and absent days | Formula added `absentDays + unpaidLeaveDays` where absent days already counted missing attendance | Adjusted formula to `Math.max(0, absentDays - paidLeaveDays)` | ✅ **PASS (Verified)** |
| **DEF-06** | `full-workflow.test.ts` | Invalid import name `payrollRunItems` | Table export in `src/db/schema.ts` is `payrollItems` | Corrected import and query references to `payrollItems` | ✅ **PASS (Verified)** |
| **DEF-07** | `full-workflow.test.ts` | Parameter order mismatch on `LeaveService.approveRequest` | Test passed `(requestId, approverId, orgId)` instead of `(orgId, requestId, approverId)` | Aligned parameter order with service signature | ✅ **PASS (Verified)** |

---

## Final Defect Status

- **Total Defects Identified**: 7
- **Resolved & Verified**: 7 (100%)
- **Open / Blocked Defects**: 0
- **Overall Status**: **PASS**
