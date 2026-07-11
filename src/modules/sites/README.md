# Sites Module

## Purpose
Configures physical check-in locations, geofencing perimeters, and coordinates constraints.

## Business Rules
- A site must contain exact `latitude`, `longitude`, and `radius` parameters (in meters).
- Employees must check-in within these site boundaries (unless geofencing is bypassed).
- Status values: `ACTIVE`, `INACTIVE`.

## API
- `GET /api/sites` - List all workspace geofences.
- `POST /api/sites` - Add a new site location.
- `PUT /api/sites/[id]` - Edit geofence bounds or parameters.
- `DELETE /api/sites/[id]` - Soft delete/deactivate a site.

## Components
- `SiteForm` - Form with map coordinate inputs.
- `SiteTable` - Management listing.

## Dependencies
- `drizzle-orm` (database queries)

## Future Scope (V2)
- Multi-geofence polyline bounds.
- Wifi SSIDs binding lock.
