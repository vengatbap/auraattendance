# API Standards

To keep the frontend state management clean and consistent, all API endpoints (Next.js route handlers) must return data conforming to these standard formats.

## 1. Standard Success Response

Every successful API response must return a `200 OK` or `201 Created` with a JSON payload of this structure:

```json
{
  "success": true,
  "message": "Employees retrieved successfully",
  "data": {
    "employees": []
  },
  "meta": {
    "page": 1,
    "limit": 10,
    "total": 0
  },
  "errors": null
}
```

### Response Fields
- `success`: Boolean indicating if the operation succeeded (`true`).
- `message`: User-friendly descriptive summary of the response.
- `data`: Object containing the payload records.
- `meta`: Optional pagination or rate limit parameters.
- `errors`: Always `null` on success.

---

## 2. Standard Error Response

Every failed API call must return the appropriate HTTP error code (e.g., `400`, `401`, `403`, `404`, `409`, `500`) with this JSON payload structure:

```json
{
  "success": false,
  "message": "Employee not found",
  "data": null,
  "meta": null,
  "errors": {
    "global": ["The employee identifier provided is invalid or has been deactivated"],
    "employeeId": ["Invalid format. Must be a valid UUID v4"]
  }
}
```

### Error Fields
- `success`: Always `false`.
- `message`: High-level error message summarizing the failure.
- `data`: Always `null`.
- `meta`: Always `null`.
- `errors`: A key-value dictionary mapping fields to arrays of validation error messages.
  - Field-specific errors use the parameter name (e.g. `employeeId`).
  - Non-field errors use the `"global"` key.
