# Super Admin Demo Script

## Persona
- **User**: Alex Morgan (`admin@platform.aura`)
- **Role**: `super_admin` (Platform Administrator)
- **Target URL**: `/admin/dashboard`

---

## Business Story & Script

### 1. Platform Login & Automatic Landing
> *"As a Super Admin, logging into Aura automatically brings us to the Platform Control Plane (`/admin/dashboard`), separating multi-tenant infrastructure from any specific customer tenant."*

1. Open `/login`
2. Enter credentials: `admin@platform.aura` / `AdminSecret123!`
3. Verify automatic redirect to `/admin/dashboard`
4. Point out Platform Control Plane metrics:
   - Total Active Organizations
   - Platform Monthly Recurring Revenue / Tenant Subscriptions
   - Total System Punch Volume today
   - System Health: Database & Engine status

### 2. Tenant Fleet Management (`/admin/tenants`)
> *"Aura allows instant provisioning and lifecycle management of isolated customer organizations without data cross-leakage."*

1. Navigate to `/admin/tenants`
2. Review active tenant roster:
   - `Bahrain Water Services` (`bws`)
   - `Gulf Logistics Corp` (`glc`)
   - `Apex Manufacturing` (`apex`)
3. Click `+ Provision Organization`:
   - Name: `Oman Energy Systems`
   - Subdomain slug: `oman-energy`
   - Plan: Enterprise (Face + GPS + Payroll)
4. Show real-time creation and isolation.

### 3. Global System Audit Log (`/admin/audit`)
> *"Every tenant provisioning, permission change, and impersonation action is logged in an immutable, compliant audit trail."*

1. Navigate to `/admin/audit`
2. Show structured audit logs with Actor (`admin@platform.aura`), IP Address, Action type (`TENANT_CREATED`), and metadata JSON payload.

### 4. Entering Support Mode (Tenant Impersonation)
> *"When a customer needs hands-on assistance, Super Admin can enter Support Mode. This is not a security bypass: the platform generates an auditable session stamped with the supervisor's identity."*

1. Navigate back to `/admin/tenants`
2. Click **[Enter Tenant Support Mode]** next to `Bahrain Water Services`
3. Notice the interface transitions into `/dashboard` with a top amber banner:
   `🛡 SUPPORT MODE: Viewing as Tenant (Bahrain Water Services)  [Exit Support Mode]`
4. Demonstrate completing a quick review inside the customer workspace.
5. Click **[Exit Support Mode]** in the top bar.
6. Verify instant return to `/admin/tenants` and confirm the action was logged in `/admin/audit`.

### 5. Secure Logout
1. Click the top-right avatar menu &rarr; **Logout**.
2. Verify session cookie invalidation and redirect to `/login`.
