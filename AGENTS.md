<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Aura Attendance Development Rules

All AI agents and coding assistants must strictly follow these rules when modifying this repository:

## Core Coding Principles
- **Never rewrite working code.** Always extend existing modules rather than recreating them.
- **Never change the database schema without migrations.** Use Drizzle Kit to generate and apply updates (`npm run db:push` or migration files).
- **Never hardcode roles or use direct role string checks (e.g. `role === 'admin'`).** Use `PermissionService.can(user, action)` and `PermissionService.cannot(user, action)`.
- **Use the Repository Pattern.** All SQL queries and database access must reside in repositories (e.g., `src/modules/[module]/repository/`). 
- **No SQL in Components.** UI files must never access the database directly.
- **No SQL in API Route Handlers.** Route handlers should only parse inputs, check permissions, and delegate execution to the service layer.
- **Audit Logs for Mutations.** Every database mutation (inserts, updates, deletes) must write a compliance entry using `AuditService.log()`.
- **Prefer Server Components.** Use React Server Components (RSC) by default unless user interactivity or client-side states (hooks) are explicitly required.
- **No Duplication.** Reuse visual components under `src/components/ui/` and core libraries under `src/lib/`. Avoid copying API parsing or verification logic.

## State Requirements
Every user-facing feature or dashboard widget must support:
- **Loading State:** Skeletons or spinners while fetching data.
- **Empty State:** Clean descriptive fallback state if no records are found.
- **Error State:** Clear user-facing message explaining what failed.
- **Success State:** Instant visual feedback (badges, checkmarks, or toasts) on successful operations.

## Pull Request and Quality Checks
Every feature slice must compile cleanly before commit. Execute:
- `npm run build`
- `npm run lint`
- `npm run type-check`

**Do not commit or push if any of these checks fail.** Resolve the compiler or linter errors before proceeding.
