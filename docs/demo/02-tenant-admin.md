# Tenant Admin Demo Script

## Persona
- **User**: Tariq Al-Mansoor (`admin@bahrainwater.com`)
- **Role**: `admin` (Tenant Owner / HR Director)
- **Organization**: Bahrain Water Services (`bws`)
- **Target URL**: `/dashboard`

---

## Business Story & Script

### 1. Tenant Admin Morning Dashboard
> *"Tariq begins his morning by opening the Bahrain Water Services workspace. In under 3 seconds, he understands the complete workforce health: who is present, who is late, and which anomalies need resolution before payroll."*

1. Login as `admin@bahrainwater.com`
2. Lands directly on `/dashboard`
3. Point out the 4-card operational grid:
   - **Present Today**: `84 / 92 (91% active)`
   - **Late Arrivals**: `4` (flagged with grace period timing)
   - **Missing Checkouts**: `3` (yesterday's unclosed sessions)
   - **Needs Review**: `7 issues` (direct link to Operations Hub)
4. Show the live **Recent Punches** stream on the right column with timestamps, employee initials, and site labels.

### 2. Employee Directory & Profile Setup (`/dashboard/employees`)
> *"Managing workers, assigning site geofences, and enrolling biometric face profiles happens in one unified screen."*

1. Navigate to `/dashboard/employees`
2. Search for employee `Ahmed Hassan` (Code: `BWS-1042`)
3. Click `Edit Profile`:
   - **Basic Info**: Department (`Water Distribution`), Designation (`Field Maintenance Engineer`)
   - **Site Geofence Assignment**: Assigned to `Tubli Pumping Station` (250m radius)
   - **Biometric Face Enrollment**: Show enrolled 128-dimensional embedding descriptor status
   - **Security PIN**: Show encrypted bcrypt PIN credential status
4. Click `+ Add Employee` to demonstrate new hire onboarding in 30 seconds.

### 3. Geofence Site Setup (`/dashboard/sites`)
> *"Every facility has an assigned latitude, longitude, and permitted radius. Punches outside this circle trigger geofence alerts."*

1. Navigate to `/dashboard/sites`
2. Inspect `Tubli Pumping Station` & `Sitra Desalination Plant`
3. Show radius map visualization and active device count.

### 4. Organization Feature Configuration (`/dashboard/settings`)
> *"Admins control authentication policies for their company: enabling/disabling Face scanning, PIN fallbacks, lockout attempt thresholds, and grace period windows."*

1. Navigate to `/dashboard/settings`
2. Highlight:
   - `Face Recognition`: Enabled
   - `PIN Fallback`: Enabled
   - `PIN Max Attempts`: 5 attempts (30-minute lockout)
   - `Grace Period`: 15 minutes past 09:00 AM

### 5. Topbar Profile Menu & Navigation
1. Click avatar `TM ▾` in top right:
   - Confirm company name `Bahrain Water Services`
   - Access **Profile**, **Account Settings**, **Help & Documentation**
   - Click **Logout** to end the tenant session cleanly.
