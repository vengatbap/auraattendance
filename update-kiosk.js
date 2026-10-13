const fs = require('fs');
let content = fs.readFileSync('src/app/attendance/page.tsx', 'utf8');

const newFunc = `  const submitPinPunch = useCallback(async (employeeCode: string, pin: string) => {
    setBusy(true);
    setError("");
    setResult(null);

    try {
      let position: GeolocationPosition;
      try {
        position = await getFreshLocation();
      } catch {
        throw new Error("Unable to read GPS location. Location is required.");
      }

      if (!navigator.onLine) {
        throw new Error("PIN authentication requires an active internet connection.");
      }

      const searchParams = new URLSearchParams(window.location.search);
      const kioskToken = searchParams.get("kioskToken");
      const storedKioskToken = localStorage.getItem("aura_kiosk_token") || kioskToken || undefined;
      const clientEventId = "evt_" + Date.now() + "_" + Math.random().toString(16).slice(2, 8);

      const response = await fetch("/api/attendance/punch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientEventId,
          employeeCode,
          pin,
          authMethod: "PIN",
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          browser: navigator.userAgent,
          deviceInfo: navigator.platform,
          capturedAt: new Date().toISOString(),
          kioskToken: storedKioskToken
        }),
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.message || "Verification failed");
      }

      setResult({
        action: result.data.action === "CHECK_IN" ? "check_in" : result.data.action === "CHECK_OUT" ? "check_out" : "already_checked_out",
        matched: true,
        employee: result.data.employee,
        site: result.data.site || { name: "Unknown" },
        faceScore: 1.0,
        distanceMeters: result.data.gpsDistanceMeters ?? null,
        locationMatched: !result.data.flags.includes("OUTSIDE_GEOFENCE"),
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
      });

      toast.success("Attendance recorded");
      setUsePin(false);
    } catch (err: any) {
      setError(err.message || "Punch failed");
      toast.error(err.message || "Punch failed");
    } finally {
      setBusy(false);
    }
  }, []);`;

content = content.replace('  // Main Punch Action Trigger', newFunc + '\n\n  // Main Punch Action Trigger');
content = content.replace('export default function AttendancePunchPage() {', 'import { PinPad } from "./pin-pad";\n\nexport default function AttendancePunchPage() {\n  const [usePin, setUsePin] = useState(false);');

const videoReplace = `{/* Video container */}
              <div className="p-4 sm:p-5">
                {usePin ? (
                  <PinPad
                    onSubmit={submitPinPunch}
                    onCancel={() => setUsePin(false)}
                    busy={busy}
                  />
                ) : (
                  <>
                  <canvas ref={canvasRef} className="hidden" />
                  <div className="relative aspect-[4/3] overflow-hidden rounded-3xl bg-slate-950 border border-slate-900">
                    <video`;

content = content.replace(`{/* Video container */}
              <div className="p-4 sm:p-5">
                <canvas ref={canvasRef} className="hidden" />
                <div className="relative aspect-[4/3] overflow-hidden rounded-3xl bg-slate-950 border border-slate-900">
                  <video`, videoReplace);

const retryReplace = `Retry Location Reading
                  </button>
                )}

                {!usePin && !result && (
                  <button onClick={() => { stopCamera(); setUsePin(true); }} className="mt-4 w-full flex items-center justify-center text-sm font-medium text-slate-400 hover:text-slate-300">
                    Can't use Face Scan? Use PIN
                  </button>
                )}

                </>
                )}`;

content = content.replace(`Retry Location Reading
                  </button>
                )}`, retryReplace);

fs.writeFileSync('src/app/attendance/page.tsx', content);
