# Department Manager & RBAC Boundary Demo

## Persona
- **User**: Fatima Al-Zaabi (`manager.ops@bahrainwater.com`)
- **Role**: `manager` (Operations Department Manager)
- **Organization**: Bahrain Water Services

---

## Business Story & Script

### 1. Manager Authentication & Tailored Navigation
> *"Managers see only what they are authorized to manage. Aura automatically filters navigation options using `PermissionService`."*

1. Login as `manager.ops@bahrainwater.com`
2. Lands on `/dashboard`
3. Notice sidebar items tailored for managers:
   - **Allowed**: `Attendance`, `Employees (Department)`, `Operations`, `Leave`, `Reports`
   - **Hidden / Restricted**: `Settings (Org Ownership)`, `Payroll Runs Locking`, `Admin Platform Access`

### 2. Leave Request Approval Workflow (`/dashboard/leave`)
> *"When Ahmed Hassan submits a 2-day annual leave request, Fatima receives it in her queue, reviews his balance, and approves it with a note."*

1. Navigate to `/dashboard/leave`
2. View `Pending Requests` card:
   - **Employee**: `Ahmed Hassan` (Code: `BWS-1042`)
   - **Leave Type**: Annual Paid Leave (2 days: Sep 12 – Sep 13)
   - **Current Balance**: `18.0 / 22.0 days remaining`
3. Click **[Approve Request]**:
   - System updates remaining balance from `18.0` &rarr; `16.0`
   - Automatically informs the Attendance Engine so Ahmed is marked as `ON_LEAVE` rather than `ABSENT` on those dates.
   - Automatically registers 2 paid days in the upcoming monthly payroll run.

### 3. Demonstrating RBAC Boundary Enforcement
> *"To prove strict Role-Based Access Control, Fatima attempts to access an unauthorized administrative area."*

1. Attempt navigating to `/dashboard/settings` or calling a restricted mutation endpoint.
2. System displays a clean, user-friendly permission error:
   `"403 Forbidden: You do not have permission to modify organization settings."`
3. Attempt accessing `/admin` (Platform Control Plane):
   System redirects immediately to login or returns 403.
4. This verifies security boundaries are enforced server-side by `PermissionService.can()`.
