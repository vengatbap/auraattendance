# PRODUCT_RULES.md

This document defines the core product philosophy and design principles for Aura Attendance. Every developer and AI agent must read and follow these rules.

## Aura Principles

1. **Attendance is the product.** Everything else supports attendance.
2. **Maximum 3 clicks** for any common action.
3. **Maximum 5 seconds** for an employee to record attendance (biometric/GPS punch).
4. **Maximum 60 seconds** to enroll or create a new employee.
5. **Never ask for information that isn't required.** Keep inputs minimal.
6. **One screen, one purpose.**
7. **Every page answers one question:**
   - *Attendance:* Can I punch?
   - *Employee:* Can I manage employees?
   - *Reports:* Can I export?
   - *No mixed pages.*
8. **Under 500ms load time** for every page (with cached data).
9. **Full mobile compatibility:** Every page must work and look premium on a `360px` mobile screen.
10. **State indicators:** Every screen must have explicit states for: Loading, Empty, Error, and Success.
11. **No modal if a page is better.** Avoid pop-ups unless necessary.
12. **Maximum 2 levels** of nested menus.
13. **Autosave** on forms where appropriate.
14. **No hard deletes.** Prefer `deactivate`, `archive`, or `soft delete` to preserve audit records.
15. **Everything is searchable.**

---

## core Attendance Modules

### 1. Attendance Dashboard
Focuses on operational check-ins:
- Today's Status Summary
- Who's Present
- Who's Late
- Who's Missing
- Who's Outside Radius

### 2. Live Attendance Feed
A real-time ticker showing punches as they occur:
- `08:01` · `Ahmed` · `Checked In` · `SEEF` · `✔`

### 3. Attendance Issues Board
A single page listing anomalies requiring administrator attention:
- Duplicate Face Embeddings
- Missing checkout punches
- Out-of-radius check-ins
- Low biometric confidence scores
- Offline Sync Queues

### 4. Face Center
Biometrics enrollment management:
- Status (Face Enrolled)
- Quality score
- Versioning
- Re-registration controls
- Calibration history

### 5. Device Center
Audit log of punch origins:
- Browser types (Chrome, Safari)
- Operating systems (Android, iOS)
- Device classification (Tablet, mobile, kiosk)

### 6. Organization Health
Onboarding helper checklist:
- Setup tracker (e.g. 95% complete)
- Logo uploaded state
- First site created state
- First employee enrolled state
- Face captures registered state

### 7. Attendance Replay
High-fidelity log inspector displaying:
- Capture Photo
- Cosine similarity confidence score
- GPS coordinates & distance in meters
- Browser agent & IP address
- Timestamp & site bounds

### 8. Kiosk Status Indicator
Reassuring visual health bar showing:
- Camera online/offline
- GPS location permissions active
- Network connectivity state
- Face recognition model loaded state

### 9. Smart Notifications
Actionable warnings, not noise:
- *"5 employees haven't checked out"*
- *"2 punches need review"*
- *"Face quality dropped below threshold"*
- *"Offline punches synced successfully"*
