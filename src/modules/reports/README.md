# Reports Module

## Purpose
Aggregates daily attendance, computed worked hours, and late frequency logs into spreadsheets and printable files.

## Business Rules
- Filters must enforce date constraints (Today, Yesterday, This Week, This Month).
- Reports are scoped strictly within the active session's `organizationId`.

## API
- `GET /api/reports/generate` - Fetch summarized attendance records.
- `GET /api/reports/export` - Generate and download `.xlsx` or `.csv` files.

## Components
- `ReportsFilter` - Date and status filters.
- `ExportButton` - Excel sheet exporter trigger.

## Dependencies
- `exceljs` (Excel file structure builder)
- `drizzle-orm`

## Future Scope (V2)
- Scheduled monthly report email delivery.
- Custom report layouts designer.
