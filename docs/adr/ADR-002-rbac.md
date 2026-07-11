# ADR-002: Role-Based Access Control (RBAC)

## Status
Accepted

## Date
2026-07-11

## Context
We need to manage differing levels of privilege for portal administrators within a tenant organization, and support global system administrators.

## Decision
We define 4 primary roles:
1. `super_admin`: Global platform administrator. Can access `/admin`, view all database tables, configure features flags, and adjust pricing limits.
2. `admin`: Tenant administrator. Has full control over organization data, branding settings, and can create/delete other tenant users.
3. `manager`: Tenant manager. Can register employees, sites, departments, log attendance punches, view lists, and make audit overrides. Cannot alter tenant user profiles or billing configurations.
4. `viewer`: Tenant viewer. Read-only permissions to view the dashboard and logs.

Rather than checking role strings directly in business logic (e.g. `role === 'admin'`), we use dynamic permission checks via `PermissionService.can(user, 'employee.create')` to ensure modularity and future extensibility.

## Consequences
- **Pros:** Flexible, secure, and ready for future custom permissions.
- **Cons:** Slightly higher complexity when writing UI rules compared to checking role strings directly.
