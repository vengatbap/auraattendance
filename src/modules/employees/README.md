# Employees Module

## Purpose
Manages employee profiles, biometrics registrations, and site/department assignments inside a tenant boundary.

## Business Rules
- Employees must have a unique `employeeCode` and `governmentId` within their organization.
- Soft-delete rule: setting `deletedAt = timestamp` instead of dropping the record.
- Status values: `ACTIVE`, `INACTIVE`, `ARCHIVED`.

## API
- `GET /api/employees` - List all employees of the organization.
- `POST /api/employees` - Register a new employee.
- `GET /api/employees/[id]` - Retrieve a single profile details.
- `PUT /api/employees/[id]` - Update employee status, photo, or details.
- `DELETE /api/employees/[id]` - Soft delete/deactivate an employee profile.

## Components
- `EmployeeForm` - Enrollment and profile updates.
- `EmployeeTable` - Directory listing with search and status badges.
- `FaceEnrollment` - Camera-based face landmark scan interface.

## Dependencies
- `@vladmandic/face-api` (client-side biometrics landmarks)
- `drizzle-orm` (database repositories)

## Future Scope (V2)
- Bulk import of employee records via Excel sheets.
- Direct active directory/LDAP sync integration.
