"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ScanFace, Wifi, WifiOff, Camera, RefreshCw, ChevronLeft } from "lucide-react";
import { haversineDistance, toDateString } from "@/utils";
import { toast } from "sonner";

// ─────────────────────────────────────────
// Types
// ─────────────────────────────────────────

interface Site {
  id: string; name: string;
  latitude: number; longitude: number; radius: number;
}

interface Profile {
  employeeId: string; embedding: number[];
  name: string; employeeCode: string;
}

interface KioskConfig {
  id: string; name: string;
  allowMultiplePunches: boolean; minimumPunchGapMinutes: number;
  autoCheckout: boolean; autoCheckoutTime: string;
  gracePeriodMinutes: number; lateAfterTime: string;
  faceMatchThreshold: number;
}

interface PunchResult {
  action: "check_in" | "check_out" | "already_checked_out";
  employee: { name: string; employeeCode: string };
  site: { name: string };
  faceScore: number;
  distanceMeters: number | null;
  locationMatched: boolean;
  latitude: number; longitude: number;
}

interface PendingPunch {
  employeeId: string; siteId: string | null;
  timestamp: string; latitude: number; longitude: number;
  photo?: string; deviceInfo?: string; browser?: string;
  action: "check_in" | "check_out";
  status: "present" | "late";
  faceScore: number;
  employeeName: string; employeeCode: string; siteName: string;
}

type KioskMode = "FACE" | "PIN" | "RESULT" | "ERROR" | "CAMERA_ERROR";
type CameraState = "STARTING" | "READY" | "SCANNING" | "DENIED" | "UNAVAILABLE" | "FACE_DETECTED" | "VERIFYING";

// Map backend error codes → human messages
const ERROR_MESSAGES: Record<string, string> = {
  FACE_NOT_REGISTERED: "Face not registered. Please use PIN or contact your supervisor.",
  FACE_LOW_CONFIDENCE: "Face could not be verified. Try again or use PIN.",
  OUTSIDE_GEOFENCE: "You are outside the permitted attendance area.",
  DUPLICATE_PUNCH: "Attendance was already recorded.",
  RATE_LIMIT_EXCEEDED: "Too many attempts. Please wait a moment.",
  INACTIVE: "Attendance is currently unavailable. Contact your administrator.",
  SUSPENDED: "Attendance is currently unavailable. Contact your administrator.",
  DEFAULT: "Verification failed. Please try again or use PIN.",
};

// ─────────────────────────────────────────
// Face model loader (singleton)
// ─────────────────────────────────────────

let faceModelsPromise: Promise<typeof import("@vladmandic/face-api")> | null = null;
const FACE_MODEL_URL = "https://justadudewhohacks.github.io/face-api.js/models";

async function loadFaceModels() {
  if (!faceModelsPromise) {
    faceModelsPromise = import("@vladmandic/face-api").then(async (faceapi) => {
      await Promise.all([
        faceapi.nets.ssdMobilenetv1.loadFromUri(FACE_MODEL_URL),
        faceapi.nets.faceLandmark68Net.loadFromUri(FACE_MODEL_URL),
        faceapi.nets.faceRecognitionNet.loadFromUri(FACE_MODEL_URL),
      ]);
      return faceapi;
    });
  }
  return faceModelsPromise;
}

function capturePhoto(video: HTMLVideoElement | null, canvas: HTMLCanvasElement | null) {
  if (!video || !canvas || !video.videoWidth) return null;
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;
  ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL("image/jpeg", 0.86);
}

function getFreshLocation() {
  return new Promise<GeolocationPosition>((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(resolve, reject, {
      enableHighAccuracy: true, maximumAge: 0, timeout: 12_000,
    });
  });
}

async function generateDescriptor(photo: string) {
  const faceapi = await loadFaceModels();
  const image = new Image();
  image.src = photo;
  await new Promise((resolve) => { image.onload = resolve; });
  const detection = await faceapi.detectSingleFace(image).withFaceLandmarks().withFaceDescriptor();
  if (!detection) throw new Error("NO_FACE");
  return Array.from(detection.descriptor);
}

function matchLocalEmbedding(descriptor: number[], profiles: Profile[], threshold = 0.6) {
  if (!profiles.length) return null;
  let best: { profile: Profile; distance: number } | null = null;
  for (const p of profiles) {
    let sum = 0;
    for (let i = 0; i < descriptor.length; i++) sum += (descriptor[i] - p.embedding[i]) ** 2;
    const d = Math.sqrt(sum);
    if (!best || d < best.distance) best = { profile: p, distance: d };
  }
  if (best && best.distance <= threshold) {
    return { employeeId: best.profile.employeeId, name: best.profile.name, employeeCode: best.profile.employeeCode, score: 1 - best.distance };
  }
  return null;
}

function processOfflinePunch(
  descriptor: number[], coords: { latitude: number; longitude: number },
  photo: string, cachedProfiles: Profile[], sites: Site[], kioskConfig: KioskConfig | null
): PunchResult {
  const match = matchLocalEmbedding(descriptor, cachedProfiles, kioskConfig?.faceMatchThreshold);
  if (!match) throw new Error("FACE_NOT_REGISTERED");

  const nearest = sites
    .map((s) => ({ site: s, distance: haversineDistance(coords.latitude, coords.longitude, s.latitude, s.longitude) }))
    .sort((a, b) => a.distance - b.distance)[0];

  const matchedSite = nearest && nearest.distance <= nearest.site.radius ? nearest.site : null;

  const today = toDateString();
  const queue: PendingPunch[] = JSON.parse(localStorage.getItem("aura_pending_punches") || "[]");
  const existing = queue.find((p) => p.employeeId === match.employeeId && p.timestamp.startsWith(today));

  let action: PunchResult["action"] = "check_in";
  if (existing?.action === "check_in") action = "check_out";
  else if (existing?.action === "check_out") action = "already_checked_out";

  const [lh, lm] = (kioskConfig?.lateAfterTime || "09:15").split(":").map(Number);
  const grace = kioskConfig?.gracePeriodMinutes ?? 15;
  const now = new Date();
  const status: "present" | "late" = now.getHours() * 60 + now.getMinutes() > lh * 60 + lm + grace ? "late" : "present";

  if (action !== "already_checked_out") {
    queue.push({
      employeeId: match.employeeId, siteId: matchedSite?.id ?? null,
      timestamp: now.toISOString(), latitude: coords.latitude, longitude: coords.longitude,
      photo, deviceInfo: navigator.platform, browser: navigator.userAgent,
      action: action as "check_in" | "check_out", status,
      faceScore: match.score, employeeName: match.name,
      employeeCode: match.employeeCode, siteName: matchedSite?.name ?? "Unknown",
    });
    localStorage.setItem("aura_pending_punches", JSON.stringify(queue));
  }

  return {
    action, employee: { name: match.name, employeeCode: match.employeeCode },
    site: { name: matchedSite?.name ?? "Unknown" }, faceScore: match.score,
    distanceMeters: nearest?.distance ?? null, locationMatched: !!matchedSite,
    latitude: coords.latitude, longitude: coords.longitude,
  };
}

// ─────────────────────────────────────────
// Main Kiosk Page
// ─────────────────────────────────────────

export default function AttendancePunchPage() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const autoTrackActiveRef = useRef(false);
  const holdStartRef = useRef<number | null>(null);
  const resetTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [isOnline, setIsOnline] = useState(() =>
    typeof window !== "undefined" ? navigator.onLine : true
  );
  const [mode, setMode] = useState<KioskMode>("FACE");
  const [cameraState, setCameraState] = useState<CameraState>("STARTING");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<PunchResult | null>(null);
  const [errorCode, setErrorCode] = useState<string>("");
  const [errorMsg, setErrorMsg] = useState<string>("");
  const [now, setNow] = useState(() => new Date());
  const [pendingCount, setPendingCount] = useState(0);

  // Cached data from localStorage
  const [sites] = useState<Site[]>(() => {
    try { return JSON.parse(localStorage.getItem("aura_kiosk_sites") || "[]"); } catch { return []; }
  });
  const [cachedProfiles] = useState<Profile[]>(() => {
    try { return JSON.parse(localStorage.getItem("aura_kiosk_profiles") || "[]"); } catch { return []; }
  });
  const [kioskConfig] = useState<KioskConfig | null>(() => {
    try { return JSON.parse(localStorage.getItem("aura_kiosk_config") || "null"); } catch { return null; }
  });
  const [kioskToken] = useState<string | null>(() => {
    try { return localStorage.getItem("aura_kiosk_token"); } catch { return null; }
  });

  // Clock tick
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  // Online/offline detection
  useEffect(() => {
    const onOnline = () => setIsOnline(true);
    const onOffline = () => setIsOnline(false);
    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);
    return () => { window.removeEventListener("online", onOnline); window.removeEventListener("offline", onOffline); };
  }, []);

  // Pending count from localStorage
  useEffect(() => {
    try {
      const cached = localStorage.getItem("aura_pending_punches");
      setPendingCount(cached ? JSON.parse(cached).length : 0);
    } catch { setPendingCount(0); }
  }, []);

  // ── Camera controls ──────────────────────────────────────────

  const stopCamera = useCallback(() => {
    autoTrackActiveRef.current = false;
    holdStartRef.current = null;
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
    setCameraState("STARTING");
  }, []);

  const startCamera = useCallback(async () => {
    setCameraState("STARTING");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: { ideal: 1280 }, height: { ideal: 960 } },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setCameraState("READY");
      // Pre-warm face models in background
      void loadFaceModels().catch(() => null);
    } catch (err: any) {
      if (err?.name === "NotAllowedError" || err?.name === "PermissionDeniedError") {
        setCameraState("DENIED");
      } else {
        setCameraState("UNAVAILABLE");
      }
    }
  }, []);

  // ── Auto-start camera on mount ─────────────────────────────

  useEffect(() => {
    void startCamera();
    return () => stopCamera();
  }, [startCamera, stopCamera]);

  // ── Auto-tracking loop (face detection) ───────────────────

  useEffect(() => {
    if (mode !== "FACE" || cameraState !== "READY" || busy || result) {
      autoTrackActiveRef.current = false;
      return;
    }

    autoTrackActiveRef.current = true;
    let cancelled = false;

    async function tick() {
      if (cancelled || !autoTrackActiveRef.current) return;
      if (!videoRef.current) { setTimeout(tick, 500); return; }

      try {
        const faceapi = await loadFaceModels();
        const detection = await faceapi.detectSingleFace(
          videoRef.current,
          new faceapi.SsdMobilenetv1Options({ minConfidence: 0.8 })
        );

        if (cancelled) return;

        if (detection) {
          if (!holdStartRef.current) {
            holdStartRef.current = Date.now();
            setCameraState("FACE_DETECTED");
          } else if (Date.now() - holdStartRef.current >= 1200) {
            // Trigger punch
            autoTrackActiveRef.current = false;
            setCameraState("VERIFYING");
            void submitFacePunch();
            return;
          }
        } else {
          holdStartRef.current = null;
          setCameraState("READY");
        }
      } catch {
        // skip frame
      }

      if (!cancelled) setTimeout(tick, 400);
    }

    setTimeout(tick, 400);
    return () => { cancelled = true; autoTrackActiveRef.current = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, cameraState, busy, result]);

  // ── Auto-reset after success ──────────────────────────────

  const scheduleReset = useCallback(() => {
    if (resetTimerRef.current) clearTimeout(resetTimerRef.current);
    resetTimerRef.current = setTimeout(() => {
      setResult(null);
      setMode("FACE");
      setErrorCode("");
      setErrorMsg("");
      holdStartRef.current = null;
      setCameraState("READY");
    }, 4000);
  }, []);

  useEffect(() => {
    if (result) scheduleReset();
    return () => {
      if (resetTimerRef.current) clearTimeout(resetTimerRef.current);
    };
  }, [result, scheduleReset]);

  // ── Punch helpers ─────────────────────────────────────────

  const buildClientEventId = () => "evt_" + Date.now() + "_" + Math.random().toString(16).slice(2, 8);
  const getKioskTokenFromUrl = () => new URLSearchParams(typeof window !== "undefined" ? window.location.search : "").get("kioskToken") ?? undefined;

  const handlePunchResult = useCallback((res: any) => {
    if (!res.success) {
      const code = res.code ?? "DEFAULT";
      setErrorCode(code);
      setErrorMsg(ERROR_MESSAGES[code] ?? ERROR_MESSAGES.DEFAULT);
      setMode("ERROR");
      return;
    }
    const d = res.data;
    setResult({
      action: d.action === "CHECK_IN" ? "check_in" : d.action === "CHECK_OUT" ? "check_out" : "already_checked_out",
      employee: d.employee,
      site: d.site ?? { name: "—" },
      faceScore: d.faceScore ?? 1,
      distanceMeters: d.gpsDistanceMeters ?? null,
      locationMatched: !d.flags?.includes("OUTSIDE_GEOFENCE"),
      latitude: 0,
      longitude: 0,
    });
    setMode("RESULT");
  }, []);

  const submitFacePunch = useCallback(async () => {
    setBusy(true);
    holdStartRef.current = null;

    try {
      const photo = capturePhoto(videoRef.current, canvasRef.current);
      if (!photo) throw new Error("Camera not ready.");

      let position: GeolocationPosition;
      try {
        position = await getFreshLocation();
      } catch {
        throw new Error("Location is required for attendance.");
      }

      // Offline path
      if (!navigator.onLine) {
        const localResult = processOfflinePunch(
          await generateDescriptor(photo),
          { latitude: position.coords.latitude, longitude: position.coords.longitude },
          photo, cachedProfiles, sites, kioskConfig
        );
        setResult(localResult);
        setMode("RESULT");
        toast.info("Offline punch queued.");
        return;
      }

      const descriptor = await generateDescriptor(photo);

      const tok = kioskToken ?? getKioskTokenFromUrl();
      const res = await fetch("/api/attendance/punch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientEventId: buildClientEventId(),
          descriptor,
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          browser: navigator.userAgent,
          deviceInfo: navigator.platform,
          capturedAt: new Date().toISOString(),
          authMethod: "FACE",
          faceMatchPassed: true,
          kioskToken: tok ?? undefined,
        }),
      });

      handlePunchResult(await res.json());
    } catch (err: any) {
      const msg = err.message === "NO_FACE"
        ? "Face could not be verified. Try again or use PIN."
        : err.message ?? "Verification failed. Try again.";
      setErrorMsg(msg);
      setMode("ERROR");
    } finally {
      setBusy(false);
      setCameraState("READY");
    }
  }, [cachedProfiles, sites, kioskConfig, kioskToken, handlePunchResult]);

  const submitPinPunch = useCallback(async (employeeCode: string, pin: string) => {
    if (!navigator.onLine) {
      setErrorMsg("PIN verification requires an internet connection.");
      setMode("ERROR");
      return;
    }
    setBusy(true);
    try {
      let position: GeolocationPosition;
      try { position = await getFreshLocation(); }
      catch { throw new Error("Location is required for attendance."); }

      const tok = kioskToken ?? getKioskTokenFromUrl();
      const res = await fetch("/api/attendance/punch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientEventId: buildClientEventId(),
          employeeCode, pin,
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          browser: navigator.userAgent,
          deviceInfo: navigator.platform,
          capturedAt: new Date().toISOString(),
          authMethod: "PIN",
          kioskToken: tok ?? undefined,
        }),
      });
      handlePunchResult(await res.json());
    } catch (err: any) {
      setErrorMsg(err.message ?? "Verification failed.");
      setMode("ERROR");
    } finally {
      setBusy(false);
    }
  }, [kioskToken, handlePunchResult]);

  // ── Switch to PIN ─────────────────────────────────────────

  const switchToPin = useCallback(() => {
    stopCamera();
    setMode("PIN");
    setErrorCode("");
    setErrorMsg("");
  }, [stopCamera]);

  const switchToFace = useCallback(() => {
    setMode("FACE");
    setErrorCode("");
    setErrorMsg("");
    setResult(null);
    void startCamera();
  }, [startCamera]);

  // ── Retry after error ─────────────────────────────────────

  const handleRetry = useCallback(() => {
    if (mode === "ERROR") {
      // If face-related error, offer switching; else return to face
      setMode("FACE");
      setErrorCode("");
      setErrorMsg("");
      setCameraState("READY");
    }
  }, [mode]);

  // ─────────────────────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────────────────────

  const siteName = kioskConfig?.name ?? "";

  return (
    <div className="min-h-screen bg-black text-white flex flex-col" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>
      <canvas ref={canvasRef} className="hidden" aria-hidden="true" />

      {/* ─── TOP BAR ─── */}
      <header className="flex items-center justify-between px-6 py-4 border-b border-zinc-900">
        <div className="flex items-center gap-2.5">
          <div className="size-8 rounded-xl bg-blue-600 flex items-center justify-center flex-shrink-0">
            <ScanFace className="size-4 text-white" />
          </div>
          <span className="font-bold text-sm tracking-tight">Aura</span>
        </div>

        <div className="flex items-center gap-4 text-xs text-zinc-500">
          {siteName && <span className="font-medium text-zinc-300">{siteName}</span>}
          {isOnline ? (
            <span className="flex items-center gap-1 text-emerald-500"><Wifi className="size-3" /> Online</span>
          ) : (
            <span className="flex items-center gap-1 text-amber-500"><WifiOff className="size-3" /> Offline</span>
          )}
          <span className="tabular-nums text-zinc-400 hidden sm:block">{now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}</span>
        </div>
      </header>

      {/* ─── MAIN AREA ─── */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 py-8 gap-8">

        {/* ── RESULT SCREEN ── */}
        {mode === "RESULT" && result && (
          <ResultScreen result={result} onContinue={switchToFace} />
        )}

        {/* ── ERROR SCREEN ── */}
        {mode === "ERROR" && (
          <ErrorScreen
            message={errorMsg}
            code={errorCode}
            onRetry={handleRetry}
            onPin={switchToPin}
            showPinOption={errorCode !== "OUTSIDE_GEOFENCE" && errorCode !== "DUPLICATE_PUNCH"}
          />
        )}

        {/* ── PIN MODE ── */}
        {mode === "PIN" && (
          <PinScreen
            busy={busy}
            isOnline={isOnline}
            onSubmit={submitPinPunch}
            onBack={switchToFace}
          />
        )}

        {/* ── FACE MODE ── */}
        {mode === "FACE" && (
          <FaceScreen
            videoRef={videoRef}
            cameraState={cameraState}
            busy={busy}
            isOnline={isOnline}
            pendingCount={pendingCount}
            onSwitchToPin={switchToPin}
            onStartCamera={startCamera}
          />
        )}
      </main>

      {/* ─── FOOTER ─── */}
      <footer className="px-6 py-3 border-t border-zinc-900 flex items-center justify-center">
        <p className="text-[10px] text-zinc-700 uppercase tracking-widest">Secure Attendance</p>
      </footer>
    </div>
  );
}

// ─────────────────────────────────────────
// Sub-screens
// ─────────────────────────────────────────

function FaceScreen({
  videoRef, cameraState, busy, isOnline, pendingCount, onSwitchToPin, onStartCamera
}: {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  cameraState: CameraState;
  busy: boolean;
  isOnline: boolean;
  pendingCount: number;
  onSwitchToPin: () => void;
  onStartCamera: () => void;
}) {
  const isLive = cameraState === "READY" || cameraState === "FACE_DETECTED";

  const statusText = (() => {
    if (busy || cameraState === "VERIFYING") return "Verifying...";
    if (cameraState === "STARTING") return "Starting camera...";
    if (cameraState === "DENIED") return "Camera access is required for Face Attendance.";
    if (cameraState === "UNAVAILABLE") return "Camera unavailable";
    if (cameraState === "FACE_DETECTED") return "Hold steady...";
    return "Look at the camera";
  })();

  return (
    <div className="w-full max-w-md flex flex-col items-center gap-6">
      {/* Greeting */}
      <p className="text-lg font-semibold text-zinc-400">Good morning 👋</p>

      {/* Camera Box */}
      <div className="w-full relative">
        <div
          className={`relative w-full aspect-[4/3] rounded-3xl overflow-hidden border-2 transition-colors duration-300 ${
            cameraState === "FACE_DETECTED"
              ? "border-emerald-500 shadow-[0_0_0_4px_rgba(16,185,129,0.15)]"
              : "border-zinc-800"
          }`}
          style={{ background: "#0a0a0a" }}
        >
          {/* Video element (always rendered for ref) */}
          <video
            ref={videoRef}
            autoPlay muted playsInline
            className={`absolute inset-0 w-full h-full object-cover scale-x-[-1] transition-opacity duration-500 ${isLive && !busy ? "opacity-100" : "opacity-0"}`}
            aria-label="Camera view"
          />

          {/* Overlay states */}
          {(cameraState === "STARTING") && (
            <CameraOverlay icon={<SpinnerIcon />} text="Starting camera..." />
          )}

          {(busy || cameraState === "VERIFYING") && (
            <CameraOverlay icon={<SpinnerIcon />} text="Verifying..." solid />
          )}

          {cameraState === "DENIED" && (
            <CameraOverlay
              icon={<span className="text-3xl">🔒</span>}
              text="Camera access is required for Face Attendance."
            />
          )}

          {cameraState === "UNAVAILABLE" && (
            <CameraOverlay
              icon={<Camera className="size-8 text-zinc-500" />}
              text="Camera unavailable"
            >
              <button
                onClick={onStartCamera}
                className="mt-4 px-5 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-sm font-semibold transition-colors"
              >
                Try Again
              </button>
            </CameraOverlay>
          )}

          {/* Face guide circle */}
          {isLive && !busy && (
            <div
              className={`pointer-events-none absolute inset-[8%_14%] rounded-[50%] border-2 transition-all duration-300 ${
                cameraState === "FACE_DETECTED"
                  ? "border-emerald-400 scale-105"
                  : "border-white/20 border-dashed"
              }`}
              aria-hidden="true"
            />
          )}
        </div>
      </div>

      {/* Status message */}
      <p className={`text-base font-medium transition-colors ${busy || cameraState === "VERIFYING" ? "text-blue-400 animate-pulse" : cameraState === "FACE_DETECTED" ? "text-emerald-400" : "text-zinc-400"}`}>
        {statusText}
      </p>

      {/* Camera actions for error states */}
      {cameraState === "DENIED" && (
        <button
          onClick={() => window.location.reload()}
          className="px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-sm font-bold transition-colors"
        >
          Allow Camera
        </button>
      )}

      {/* PIN fallback link */}
      {(cameraState !== "DENIED") && (
        <div className="flex items-center gap-2">
          <span className="text-sm text-zinc-600">Can't use Face?</span>
          <button
            onClick={onSwitchToPin}
            className="text-sm font-semibold text-blue-500 hover:text-blue-400 transition-colors underline-offset-2 hover:underline"
          >
            Use PIN
          </button>
        </div>
      )}

      {/* Offline / pending notice */}
      {!isOnline && pendingCount > 0 && (
        <p className="text-xs text-amber-500 font-medium">{pendingCount} offline {pendingCount === 1 ? "punch" : "punches"} queued</p>
      )}
    </div>
  );
}

function PinScreen({
  busy, isOnline, onSubmit, onBack
}: {
  busy: boolean;
  isOnline: boolean;
  onSubmit: (code: string, pin: string) => void;
  onBack: () => void;
}) {
  const [step, setStep] = useState<"CODE" | "PIN">("CODE");
  const [employeeCode, setEmployeeCode] = useState("");
  const [pin, setPin] = useState("");
  const MAX_PIN = 8;

  const press = (digit: string) => {
    if (step === "CODE") setEmployeeCode((p) => p + digit);
    else if (step === "PIN" && pin.length < MAX_PIN) setPin((p) => p + digit);
  };

  const backspace = () => {
    if (step === "CODE") setEmployeeCode((p) => p.slice(0, -1));
    else setPin((p) => p.slice(0, -1));
  };

  const next = () => {
    if (step === "CODE" && employeeCode.trim()) setStep("PIN");
    else if (step === "PIN" && pin) onSubmit(employeeCode.trim(), pin);
  };

  return (
    <div className="w-full max-w-sm flex flex-col items-center gap-6">
      {/* Back button */}
      <button onClick={onBack} className="self-start flex items-center gap-1.5 text-sm text-zinc-500 hover:text-zinc-300 transition-colors">
        <ChevronLeft className="size-4" /> Back to Face Scan
      </button>

      {/* Title */}
      <div className="text-center">
        <h2 className="text-xl font-bold text-white">{step === "CODE" ? "Employee ID" : "Enter PIN"}</h2>
        {step === "PIN" && (
          <p className="text-sm text-zinc-500 mt-1">
            ID: <span className="font-mono text-zinc-300">{employeeCode}</span>
            <button onClick={() => { setStep("CODE"); setPin(""); }} className="ml-2 text-xs text-blue-500 hover:text-blue-400">change</button>
          </p>
        )}
      </div>

      {/* Display */}
      <div className="w-full rounded-2xl border border-zinc-800 bg-zinc-950 h-16 flex items-center justify-center px-5">
        {step === "CODE" ? (
          <span className={`text-2xl font-mono tracking-widest ${employeeCode ? "text-white" : "text-zinc-700"}`}>
            {employeeCode || "—"}
          </span>
        ) : (
          <span className="text-3xl tracking-[0.6em] text-white">
            {pin ? "•".repeat(pin.length) : <span className="text-zinc-700 text-base tracking-normal">PIN</span>}
          </span>
        )}
      </div>

      {/* Numpad */}
      <div className="grid grid-cols-3 gap-3 w-full">
        {["1","2","3","4","5","6","7","8","9"].map((d) => (
          <PadButton key={d} label={d} onPress={() => press(d)} disabled={busy} />
        ))}
        <PadButton label="⌫" onPress={backspace} disabled={busy} variant="secondary" />
        <PadButton label="0" onPress={() => press("0")} disabled={busy} />
        <PadButton
          label={busy ? "…" : step === "CODE" ? "Next" : "✓"}
          onPress={next}
          disabled={busy || (step === "CODE" && !employeeCode) || (step === "PIN" && !pin)}
          variant="primary"
        />
      </div>

      {/* Offline notice */}
      {!isOnline && (
        <p className="text-xs text-amber-500 text-center">
          PIN verification requires an internet connection.
        </p>
      )}
    </div>
  );
}

function ResultScreen({ result, onContinue }: { result: PunchResult; onContinue: () => void }) {
  const isIn = result.action === "check_in";
  const isOut = result.action === "check_out";
  const isRepeat = result.action === "already_checked_out";

  const label = isIn ? "Checked In" : isOut ? "Checked Out" : "Already Recorded";
  const color = isIn ? "#10b981" : isOut ? "#3b82f6" : "#f59e0b";

  return (
    <div className="flex flex-col items-center gap-6 text-center animate-in fade-in zoom-in-95 duration-300">
      {/* Big check */}
      <div
        className="size-24 rounded-full flex items-center justify-center"
        style={{ background: color + "20", border: `2px solid ${color}40` }}
      >
        <span className="text-5xl" style={{ color }}>✓</span>
      </div>

      {/* Action label */}
      <h1 className="text-4xl font-black tracking-tight" style={{ color }}>{label}</h1>

      {/* Employee */}
      <div>
        <p className="text-2xl font-bold text-white">{result.employee.name}</p>
        <p className="text-sm text-zinc-500 mt-1">{result.site.name}</p>
        <p className="text-sm text-zinc-400 mt-0.5 tabular-nums">{new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</p>
      </div>

      {/* Continue */}
      <button
        onClick={onContinue}
        className="mt-4 px-8 py-3 rounded-2xl bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 text-sm font-semibold text-zinc-300 transition-colors"
      >
        Tap to continue
      </button>

      <p className="text-xs text-zinc-700">Returning automatically in a few seconds…</p>
    </div>
  );
}

function ErrorScreen({
  message, code, onRetry, onPin, showPinOption
}: {
  message: string; code: string;
  onRetry: () => void; onPin: () => void;
  showPinOption: boolean;
}) {
  return (
    <div className="flex flex-col items-center gap-6 text-center max-w-sm">
      <div className="size-20 rounded-full bg-rose-500/10 border border-rose-500/20 flex items-center justify-center">
        <span className="text-4xl">⚠</span>
      </div>

      <p className="text-lg font-semibold text-white leading-snug">{message}</p>

      <div className="flex flex-col gap-3 w-full">
        <button
          onClick={onRetry}
          className="w-full py-3.5 rounded-2xl bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 font-semibold text-sm transition-colors flex items-center justify-center gap-2"
        >
          <RefreshCw className="size-4" /> Try Again
        </button>

        {showPinOption && (
          <button
            onClick={onPin}
            className="w-full py-3.5 rounded-2xl bg-blue-600 hover:bg-blue-700 font-semibold text-sm text-white transition-colors"
          >
            Use PIN Instead
          </button>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────
// Primitives
// ─────────────────────────────────────────

function CameraOverlay({ icon, text, children, solid }: {
  icon: React.ReactNode; text: string; children?: React.ReactNode; solid?: boolean;
}) {
  return (
    <div className={`absolute inset-0 flex flex-col items-center justify-center px-6 text-center ${solid ? "bg-black/80" : "bg-black/60"}`}>
      <div className="mb-3">{icon}</div>
      <p className="text-sm font-medium text-zinc-300 leading-snug max-w-[220px]">{text}</p>
      {children}
    </div>
  );
}

function SpinnerIcon() {
  return (
    <div className="size-10 rounded-full border-2 border-zinc-700 border-t-blue-500 animate-spin" />
  );
}

function PadButton({
  label, onPress, disabled, variant = "default"
}: {
  label: string; onPress: () => void; disabled?: boolean;
  variant?: "default" | "secondary" | "primary";
}) {
  const base = "h-14 rounded-2xl text-lg font-bold transition-all active:scale-95 disabled:opacity-40 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500";
  const styles = {
    default: "bg-zinc-900 border border-zinc-800 text-white hover:bg-zinc-800",
    secondary: "bg-zinc-900 border border-zinc-800 text-zinc-400 hover:bg-zinc-800 hover:text-rose-400",
    primary: "bg-blue-600 hover:bg-blue-500 text-white border border-blue-500 shadow-lg shadow-blue-900/30",
  };
  return (
    <button className={`${base} ${styles[variant]}`} onClick={onPress} disabled={disabled} aria-label={label}>
      {label}
    </button>
  );
}
