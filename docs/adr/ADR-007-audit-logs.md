# ADR-007: Audit Logs

## Status
Accepted

## Date
2026-07-11

## Context
Any adjustments to check-in/checkout times, site rules, or user creation require strict compliance tracing.

## Decision
We implement a comprehensive logging standard:
- Create entries in the `audit_logs` table for all mutations (creates, updates, deletes).
- Log records include the organization ID, user ID of operator, action code (e.g. `check_in`, `update_employee`), target entity, IP address, and browser agent details.
- Updates must save a snapshot of the modified attributes, documenting both the old value and the new value.

## Consequences
- **Pros:** Full accountability; simplified troubleshooting; compliant logs database.
- **Cons:** Additional database writes on every write request.
