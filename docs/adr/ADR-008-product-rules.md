# ADR-008: Product Rules & Simplicity

## Status
Accepted

## Date
2026-07-11

## Context
To prevent premature enterprise bloat, maintain extreme performance, and keep the user experience relentlessly focused on being the **fastest face attendance SaaS**, we need clear design and operational constraints.

## Decision
We freeze the scope of Aura Attendance V1 based on these rules:
1. **Simplified Folder Structure:** Avoid separate platform-specific directory structures. Keep platforms tools under `src/lib/[name]` and tenant specific features under `src/modules/[name]`.
2. **Billing Module:** Rename all references to subscriptions/plans to `src/lib/billing` to serve as the unified home for Stripe, invoices, and plans.
3. **No HRMS Creep:** Exclude any modules that do not directly make attendance faster, simpler, more accurate, or easier to manage. Exclude `analytics` from tenant feature flags to avoid non-core complexity.
4. **Interactive Dashboard & Replay:** Implement live tickers, anomaly/issue trackers, and detailed capture replay sheets to provide immediate, actionable feedback to admins.

## Consequences
- **Pros:** Fast loading times (<500ms); clear code organization that standard Next.js developers understand; clear guidelines for agent behaviors.
- **Cons:** Feature additions must pass strict simplicity reviews before being accepted.
