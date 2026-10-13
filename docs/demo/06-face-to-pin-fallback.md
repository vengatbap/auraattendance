# Biometric Fallback & PIN Authentication Demo

## Persona
- **Employee**: Ahmed Hassan (`BWS-1042`)
- **Station**: Tubli Pumping Station Kiosk
- **Scenario**: Harsh lighting / PPE dust preventing biometric confidence match

---

## Business Story & Script

### 1. Face Match Low Confidence / Camera Block
> *"On Day 5, heavy dust on site and sunlight glare prevent an instant 85%+ biometric confidence match."*

1. Ahmed looks at the camera &rarr; system cannot verify face with threshold confidence.
2. Screen cleanly transitions to Error Guidance Screen:
   - Message: *"Face could not be verified with confidence. Please try again or use PIN."*
   - Buttons: **[Try Face Scan Again]** and **[Use Employee PIN]**.

### 2. Touch-First PIN Keypad Fallback
> *"Without calling a supervisor or blocking the line of workers behind him, Ahmed taps 'Use PIN'."*

1. Ahmed taps **[Use Employee PIN]** (or the persistent *"Can't use Face? Use PIN"* link on the scanner).
2. Step 1 — Enter Employee Code:
   - Numpad displayed with 44px+ touch targets.
   - Ahmed types: `1042` &rarr; taps **[Next]**.
3. Step 2 — Enter Secure PIN:
   - Types his 4-digit PIN: `4821` (masked as `••••`).
   - Taps **[Submit]**.
4. Result:
   - System authenticates against bcrypt hash in `attendance_credentials`.
   - Records attendance punch with `authMethod: "PIN"`.
   - Screen displays `✓ Checked In` for Ahmed Hassan at `07:58:30 AM`.
   - Auto-resets back to face scanner for the next worker.

### 3. Security Boundary: Lockout on Failed Attempts
> *"What if an unauthorized person tries guessing PINs on the kiosk?"*

1. Demonstrate entering wrong PIN:
   - System rejects and increments failed attempt counter.
2. At 5 consecutive failed attempts:
   - Account is locked for 30 minutes.
   - Requires supervisor override in Operations Hub.
   - Prevents brute-force attempts at the physical kiosk.
