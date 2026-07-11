# ADR-005: Repository Pattern

## Status
Accepted

## Date
2026-07-11

## Context
To keep the codebase maintainable, testable, and isolated from direct database implementation choices, we need a clear data access layer.

## Decision
We enforce a Repository pattern:
- **Repository Layer:** Directly interacts with Drizzle ORM and runs database operations. They live inside `src/modules/[module]/repository/` or `src/platform/[module]/repository/`.
- **Service Layer:** Houses the business rules, validation (Zod schema checking), and calls repositories for retrieval or mutation.
- **Controller/API Layer:** Parses request bodies, authenticates session tokens, delegates to the Service layer, and formats JSON responses.

## Consequences
- **Pros:** High testability (services can mock repositories); modular boundaries; easy to swap database clients or add caching layers later.
- **Cons:** Slightly more boilerplate files per slice.
