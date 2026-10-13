# Employee Attendance Kiosk Demo (Face Recognition)

## Persona
- **Employee**: Ahmed Hassan (`BWS-1042`)
- **Station**: Tubli Pumping Station Kiosk
- **Target URL**: `/attendance`

---

## Business Story & Script

### 1. Hands-Free Arrival Flow
> *"Ahmed arrives at the pumping station at 07:55 AM. He walks up to the mounted tablet kiosk. He doesn't need to touch anything or look for buttons."*

1. Open `/attendance` on the kiosk display.
2. Camera starts automatically in high resolution.
3. Ahmed stands in front of the lens:
   - Green facial alignment oval locks onto his face.
   - Status updates: *"Face detected — hold steady..."*
   - Steady 1.2-second hold triggers biometric descriptor verification.
4. Instant Verification & Result:
   - Screen displays celebratory green badge: `✓ Checked In`
   - Shows: `Ahmed Hassan`, `Tubli Pumping Station`, `07:55:12 AM`
   - Audio / visual confirmation.
5. Auto-Reset:
   - After 4 seconds, the screen automatically returns to the live camera scanner, ready for the next employee.

---

### 2. Evening Clock-Out Flow
> *"At the end of his shift, Ahmed approaches the kiosk again."*

1. Ahmed looks at the camera scanner.
2. System detects existing check-in for today $\rightarrow$ determines action is **Check Out**.
3. Screen displays blue badge: `✓ Checked Out`, `17:00:24 PM`.
4. Auto-resets in 4 seconds.
