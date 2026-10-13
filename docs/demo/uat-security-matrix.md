# Step 1: Security & RBAC UAT Verification Matrix

## Three-Tier Verification Standard

Aura Attendance requires three tiers of proof before declaring production readiness:

```text
1. CODE VERIFIED         — TypeScript compiler (tsc), ESLint, Next.js build pass cleanly.
2. FUNCTIONALLY VERIFIED — Automated unit & integration tests execute with expected HTTP codes & data mutations.
3. REAL-WORLD VERIFIED   — Live browser execution, real camera/device testing, and physical video recording evidence.
```

---

## Complete Role & Permission Matrix

| Capability / Resource | Super Admin | Tenant Admin | Dept Manager | Supervisor | Payroll Mgr | Viewer |
|---|---|---|---|---|---|---|
| **Platform Fleet (`/admin`)** | ✅ Allowed | ❌ 403 Forbidden | ❌ 403 Forbidden | ❌ 403 Forbidden | ❌ 403 Forbidden | ❌ 403 Forbidden |
| **Tenant Impersonation (Support Mode)** | ✅ Audited | ❌ 403 Forbidden | ❌ 403 Forbidden | ❌ 403 Forbidden | ❌ 403 Forbidden | ❌ 403 Forbidden |
| **Organization Settings (`/settings`)** | ❌ (Support Mode only) | ✅ Allowed | ❌ 403 Forbidden | ❌ 403 Forbidden | ❌ 403 Forbidden | ❌ 403 Forbidden |
| **Employee Provisioning** | ❌ | ✅ Allowed | ❌ 403 Forbidden | ❌ 403 Forbidden | ❌ 403 Forbidden | ❌ 403 Forbidden |
| **Operations Hub Overrides** | ❌ | ✅ Allowed | ❌ | ✅ Allowed | ❌ | ❌ 403 Forbidden |
| **Leave Approval** | ❌ | ✅ Allowed | ✅ Allowed | ❌ | ❌ | ❌ 403 Forbidden |
| **Leave Policy & Balance Setup** | ❌ | ✅ Allowed | ❌ 403 Forbidden | ❌ 403 Forbidden | ❌ 403 Forbidden | ❌ 403 Forbidden |
| **Payroll Calculation & Approval** | ❌ | ✅ Allowed | ❌ 403 Forbidden | ❌ 403 Forbidden | ✅ Allowed | ❌ 403 Forbidden |
| **Payroll Locking (`LOCKED`)** | ❌ | ✅ Allowed | ❌ 403 Forbidden | ❌ 403 Forbidden | ✅ Allowed | ❌ 403 Forbidden |
| **Salary Data Inspection** | ❌ | ✅ Allowed | ❌ 403 Forbidden | ❌ 403 Forbidden | ✅ Allowed | ❌ 403 Forbidden |
| **Attendance Kiosk Clock-in** | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ (Employees only) |

---

## Positive & Negative UAT Test Evidence

| Test ID | Test Scenario | Executed Role / Actor | Expected Result | Status |
|---|---|---|---|---|
| **UAT-SEC-01** | Super Admin loads `/admin/dashboard` | `admin@platform.aura` | 200 OK — Fleet stats & tenant roster rendered | `FUNCTIONALLY VERIFIED` |
| **UAT-SEC-02** | Tenant Admin attempts accessing `/admin` | `admin@bahrainwater.com` | **403 Forbidden** — Redirect to login / access denied | `FUNCTIONALLY VERIFIED` |
| **UAT-SEC-03** | Manager attempts modifying Org Settings | `manager.ops@bahrainwater.com` | **403 Forbidden** — Settings mutation rejected | `FUNCTIONALLY VERIFIED` |
| **UAT-SEC-04** | Manager approves valid Leave Request | `manager.ops@bahrainwater.com` | 200 OK — Balance deducted from 18 &rarr; 16 days | `FUNCTIONALLY VERIFIED` |
| **UAT-SEC-05** | Manager attempts locking Payroll run | `manager.ops@bahrainwater.com` | **403 Forbidden** — Locked action blocked | `FUNCTIONALLY VERIFIED` |
| **UAT-SEC-06** | Tenant A attempts querying Tenant B data | `bws_user` querying `glc` log | **404/Empty** — SQL WHERE organizationId isolated | `FUNCTIONALLY VERIFIED` |
| **UAT-SEC-07** | Expired / Invalid token on protected route | `Bearer invalid_jwt` | **401 Unauthorized** — Immediate redirect to `/login` | `FUNCTIONALLY VERIFIED` |
| **UAT-SEC-08** | Post-Logout navigation to `/dashboard` | Logged-out browser session | **401 Unauthorized** — Cookie cleared, redirected | `FUNCTIONALLY VERIFIED` |
| **UAT-SEC-09** | Kiosk: 5 wrong PIN attempts | Anonymous on Kiosk | **429/Locked** — PIN account locked for 30 minutes | `FUNCTIONALLY VERIFIED` |
| **UAT-SEC-10** | Kiosk: Offline rejection of PIN | Edge offline browser | **400 Bad Request** — Offline PIN prohibited (online only) | `FUNCTIONALLY VERIFIED` |

---

## Automated Test Runner
To rerun the 16 automated RBAC boundary unit and integration tests:
```bash
npx vitest run src/lib/__tests__/rbac-uat.test.ts
```
