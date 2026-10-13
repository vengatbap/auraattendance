# Platform Support Mode & Session Isolation Demo

## Persona
- **Platform Admin**: Alex Morgan (`admin@platform.aura`)
- **Tenant**: Bahrain Water Services

---

## Business Story & Script

### 1. The Support Request Scenario
> *"Bahrain Water Services opens a ticket requesting urgent assistance verifying their biometric kiosk site radius."*

1. Alex logs into the Platform Control Plane at `/admin`.
2. Opens `/admin/tenants` &rarr; locates `Bahrain Water Services`.
3. Clicks **[Enter Tenant Support Mode]**.

### 2. The In-Tenant Support Session
1. Alex is seamlessly switched to `/dashboard`.
2. Notice the high-contrast amber top warning strip:
   `🛡 SUPPORT MODE: Viewing as Tenant (Bahrain Water Services)  [Exit Support Mode]`
3. In this state:
   - Alex views the tenant's exact UI as configured.
   - Any modifications made while in Support Mode carry audit metadata: `isSupportMode: true, actorId: alex_superadmin`.
   - Alex navigates to `/dashboard/sites` to inspect `Tubli Pumping Station`.

### 3. One-Click Safe Exit
1. Click **[Exit Support Mode]** directly in the top banner (or inside the user menu).
2. The impersonation token is revoked.
3. Alex is returned to `/admin/tenants`.
4. Audit log at `/admin/audit` confirms:
   `SUPPORT_MODE_EXITED` for tenant `Bahrain Water Services` by `alex@platform.aura`.
