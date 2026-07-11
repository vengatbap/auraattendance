# ADR-001: Multi-Tenant Architecture

## Status
Accepted

## Date
2026-07-11

## Context
We need to support multiple distinct business organizations (tenants) using a single deployed instance of Aura Attendance. Tenants must be strictly isolated: under no circumstances should tenant A see tenant B's users, employees, sites, or attendance logs.

## Decision
We adopt a **shared database, shared schema** multi-tenant model.
- Every tenant is represented by an entry in the `organizations` table.
- All tenant-owned tables (such as `users`, `employees`, `sites`, `attendance_logs`) must include a foreign key reference `organizationId`.
- Every backend database query targeting tenant-owned tables must explicitly filter by the user's active `organizationId` from the session cookie.
- Platform administrators (`isPlatformUser = true`) are not bound to a specific tenant and can bypass organization filters when querying overall platform statistics.

## Consequences
- **Pros:** Highly cost-efficient database model; easy schema migrations; fast signup onboarding.
- **Cons:** High responsibility placed on developers to ensure `organizationId` is filtered in all API routes. Strict audit rules are required to prevent data leakage.
