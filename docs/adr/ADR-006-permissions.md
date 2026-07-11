# ADR-006: Permissions

## Status
Proposed

## Date
2026-07-11

## Context
Checking role strings directly (e.g., `role === 'admin'`) is brittle and makes it difficult to introduce customized permissions or new roles later.

## Decision
We abstract role checks into an extensible permission service:
- Implement `PermissionService.can(user, action)` and `PermissionService.cannot(user, action)`.
- Map roles to lists of allowed resource actions (e.g. `employee.create`, `employee.view`, `site.write`).
- Use the `PermissionGate` component on the frontend to wrap buttons and widgets, checking client permissions dynamically.

## Consequences
- **Pros:** High flexibility; easily supports custom tenant roles in the future; readable authorization code.
- **Cons:** Requires defining all platform and tenant actions in a centralized Registry.
