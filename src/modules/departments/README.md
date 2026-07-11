# Departments Module

## Purpose
Groups employees under operational divisions (e.g. Sales, Operations, Tech) to simplify reports filtering.

## Business Rules
- Department names must be unique within a single organization.
- Status values: `ACTIVE`, `INACTIVE`.

## API
- `GET /api/departments` - List organization departments.
- `POST /api/departments` - Create a department.
- `PUT /api/departments/[id]` - Edit naming.
- `DELETE /api/departments/[id]` - Deactivate/soft-delete department.

## Components
- `DepartmentForm` - Simple text input.
- `DepartmentTable` - Quick listing.

## Dependencies
- `drizzle-orm`

## Future Scope (V2)
- Multi-tier nested departments (parent/child relations).
- Assigned manager approvals locks.
