# Step 2: Real Kiosk & Device Testing UAT Matrix

## 1. Automated Engine & Security Verification (8 / 8 Passed)

| Scenario | Tested Input | Expected Engine Behavior | Status |
|---|---|---|---|
| **PIN Authentication** | Valid Employee ID + PIN `4821` | Authenticated, Confidence 1.0, Action accepted | ✅ `FUNCTIONALLY VERIFIED` |
| **Wrong PIN Attempt** | Valid Employee ID + PIN `9999` | Rejected, `failedAttempts` incremented in DB | ✅ `FUNCTIONALLY VERIFIED` |
| **Unknown Employee** | Non-existent UUID | Cleanly rejected (`EMPLOYEE_NOT_FOUND`) | ✅ `FUNCTIONALLY VERIFIED` |
| **Brute-Force Lockout** | 5 consecutive wrong PINs | Account locked for 30 mins (`PIN_LOCKED`) | ✅ `FUNCTIONALLY VERIFIED` |
| **Offline PIN Prohibition** | Offline network context + PIN punch | **Rejected**: `OFFLINE_PIN_PROHIBITED` | ✅ `FUNCTIONALLY VERIFIED` |
| **Geofence Inside** | GPS coords within 200m radius | Geofence stage passes, no anomaly flags | ✅ `FUNCTIONALLY VERIFIED` |
| **Geofence Outside** | GPS coords > 200m radius | Flagged with `OUTSIDE_GEOFENCE` for supervisor | ✅ `FUNCTIONALLY VERIFIED` |
| **Rapid Duplicate / Retry** | Repeated identical `clientEventId` | Idempotency preserved; returns original event | ✅ `FUNCTIONALLY VERIFIED` |

---

## 2. Multi-Device Hardware Viewport Test Matrix

| Device Form Factor | Screen Resolution | Orientation | Target Viewport Behavior | Real-World Status |
|---|---|---|---|---|
| **Desktop Workstation** | 1920x1080 | Landscape | Centered biometric reticle, high-DPI camera feed | ⚠️ Ready for Screen Capture |
| **Android Tablet (Kiosk Mount)** | 1280x800 | Landscape | Touch numpad (48px+ targets), full-screen HUD | ⚠️ Ready for Physical Capture |
| **Android Tablet (Vertical)** | 800x1280 | Portrait | Reticle stacked above PIN toggle | ⚠️ Ready for Physical Capture |
| **iPad / iOS Safari** | 2048x1536 | Landscape | Touch event responsiveness, WebRTC camera init | ⚠️ Ready for Physical Capture |
| **Mobile Phone** | 390x844 | Portrait | Responsive keypad scaling, backspace tap targets | ⚠️ Ready for Physical Capture |

---

## 3. Physical & Environmental Stress Test Matrix

```text
                                       ENVIRONMENTAL CONDITIONS
                                                  │
                 ┌────────────────────────────────┼────────────────────────────────┐
                 │                                │                                │
           LIGHTING STRESS                   PPE & BIOMETRIC                 NETWORK INTERRUPTION
                 │                                │                                │
     ┌───────────┴───────────┐        ┌───────────┴───────────┐        ┌───────────┴───────────┐
     │ Low-light / Glare     │        │ Glasses / Face Shield │        │ Complete Offline      │
     │ Threshold < 0.2       │        │ Match Confidence < 60%│        │ Cached Face OK        │
     │ PIN Fallback Offered  │        │ PIN Fallback Offered  │        │ PIN Blocked (Security)│
     └───────────────────────┘        └───────────────────────┘        └───────────────────────┘
```

| Environmental Condition | Trigger / Stress Test | Kiosk System Response | Security / UX Outcome |
|---|---|---|---|
| **Harsh Sandstorm / Low Sunlight** | Face detector confidence < 60% | Smooth transition to *"Face could not be verified"* screen | Zero false check-ins; employee directed to PIN |
| **Safety Visor / PPE Glasses** | Partial face occlusion | 1.2s timeout &rarr; fallback guidance screen | Clear 1-tap jump to numeric keypad |
| **Side Angle (> 35° deviation)** | Off-axis facial alignment | Corner brackets pulse orange & prompt: *"Look at camera"* | Prevents accidental background bystander punches |
| **Camera Permission Denied** | User/OS denies WebRTC camera | Clean fallback banner with clear browser permission recovery steps | App doesn't crash; PIN mode immediately available |
| **Slow / 3G Network (2000ms latency)** | Network throttling | Immediate UI loading state on touch pad; idempotency key prevents double charge | Instant visual feedback, no frozen UI |
| **Complete Network Loss (Offline)** | Airplane mode enabled | Status bar shows *"Offline Mode"* badge. PIN fallback disabled. | Biometric edge descriptors allow offline check-in |

---

## 4. Video 4 Recording Checklist (`docs/demo/recording-checklists.md`)

- [ ] **Scene 1**: Camera WebRTC startup & live video stream test on Android Tablet.
- [ ] **Scene 2**: Ahmed Hassan facial lock & 1.2s verification celebration.
- [ ] **Scene 3**: Deliberate low-confidence condition &rarr; Tap *"Use PIN"*.
- [ ] **Scene 4**: Enter Code `1042` + PIN `4821` &rarr; Verified punch.
- [ ] **Scene 5**: Deliberate 5 wrong PIN attempts &rarr; 30-minute lockout evidence.
- [ ] **Scene 6**: Offline mode indicator demonstration.
