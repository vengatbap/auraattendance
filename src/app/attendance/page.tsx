"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ScanFace, Wifi, WifiOff, Camera, RefreshCw, ChevronLeft, ShieldCheck, Sparkles, MapPin, Clock } from "lucide-react";
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

const ERROR_MESSAGES: Record<string, string> = {
  FACE_NOT_REGISTERED: "Face not registered. Please use your PIN or contact your supervisor.",
  FACE_LOW_CONFIDENCE: "Face could not be verified with confidence. Please try again or use PIN.",
  OUTSIDE_GEOFENCE: "You are currently outside the permitted attendance site boundary.",
  DUPLICATE_PUNCH: "Your attendance was already recorded for this session.",
  RATE_LIMIT_EXCEEDED: "Too many recent punch attempts. Please wait a moment before trying again.",
  INACTIVE: "Employee account is inactive. Please contact your organization administrator.",
  SUSPENDED: "Attendance access is currently suspended for this account.",
  DEFAULT: "Identity verification failed. Please reposition your face or use PIN.",
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
// Main Kiosk Component
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

  // Cached data
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

  // Online/offline sync detection
  useEffect(() => {
    const onOnline = () => setIsOnline(true);
    const onOffline = () => setIsOnline(false);
    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);
    return () => { window.removeEventListener("online", onOnline); window.removeEventListener("offline", onOffline); };
  }, []);

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
      void loadFaceModels().catch(() => null);
    } catch (err: any) {
      if (err?.name === "NotAllowedError" || err?.name === "PermissionDeniedError") {
        setCameraState("DENIED");
      } else {
        setCameraState("UNAVAILABLE");
      }
    }
  }, []);

  useEffect(() => {
    void startCamera();
    return () => stopCamera();
  }, [startCamera, stopCamera]);

  // ── Auto-tracking loop ─────────────────────────────────────

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
        // frame skipped
      }

      if (!cancelled) setTimeout(tick, 350);
    }

    setTimeout(tick, 400);
    return () => { cancelled = true; autoTrackActiveRef.current = false; };
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

  // ── Punch execution ───────────────────────────────────────

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
      if (!photo) throw new Error("Camera frame is not ready.");

      let position: GeolocationPosition;
      try {
        position = await getFreshLocation();
      } catch {
        throw new Error("GPS Location is required for site verification.");
      }

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
        ? "Face could not be verified. Please try again or use PIN."
        : err.message ?? "Verification failed. Please try again.";
      setErrorMsg(msg);
      setMode("ERROR");
    } finally {
      setBusy(false);
      setCameraState("READY");
    }
  }, [cachedProfiles, sites, kioskConfig, kioskToken, handlePunchResult]);

  const submitPinPunch = useCallback(async (employeeCode: string, pin: string) => {
    if (!navigator.onLine) {
      setErrorMsg("PIN verification requires an active internet connection.");
      setMode("ERROR");
      return;
    }
    setBusy(true);
    try {
      let position: GeolocationPosition;
      try { position = await getFreshLocation(); }
      catch { throw new Error("GPS Location is required for attendance verification."); }

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

  const handleRetry = useCallback(() => {
    setMode("FACE");
    setErrorCode("");
    setErrorMsg("");
    setCameraState("READY");
  }, []);

  const siteName = kioskConfig?.name || "Aura Attendance Kiosk";

  return (
    <div className="relative min-h-screen bg-[#070709] text-zinc-100 flex flex-col justify-between overflow-hidden select-none">
      {/* Background ambient lighting */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_-10%,rgba(37,99,235,0.18),transparent_70%),radial-gradient(ellipse_60%_50%_at_50%_110%,rgba(15,23,42,0.6),transparent_80%)]" />

      <canvas ref={canvasRef} className="hidden" aria-hidden="true" />

      {/* ─── Kiosk Top Bar ─── */}
      <header className="relative z-10 flex items-center justify-between px-6 lg:px-10 py-5 border-b border-zinc-900/80 bg-zinc-950/40 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="size-9 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-600/25">
            <ScanFace className="size-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-base text-white tracking-tight">Aura Kiosk</span>
              {isOnline ? (
                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  <span className="size-1.5 rounded-full bg-emerald-400 animate-pulse" /> Online
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                  <WifiOff className="size-3" /> Offline Mode
                </span>
              )}
            </div>
            <p className="text-[11px] font-medium text-zinc-500">{siteName}</p>
          </div>
        </div>

        <div className="flex items-center gap-4 text-right">
          <div>
            <p className="text-sm font-extrabold text-white tabular-nums">
              {now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
            </p>
            <p className="text-[10px] font-medium text-zinc-500 uppercase tracking-widest">
              {now.toLocaleDateString([], { weekday: "short", month: "short", day: "numeric" })}
            </p>
          </div>
        </div>
      </header>

      {/* ─── Main Viewport ─── */}
      <main className="relative z-10 flex-1 flex flex-col items-center justify-center p-4 sm:p-6 lg:p-10 max-w-xl mx-auto w-full">

        {/* ── SUCCESS RESULT SCREEN ── */}
        {mode === "RESULT" && result && (
          <ResultScreen result={result} onContinue={switchToFace} />
        )}

        {/* ── ERROR RECOVERY SCREEN ── */}
        {mode === "ERROR" && (
          <ErrorScreen
            message={errorMsg}
            code={errorCode}
            onRetry={handleRetry}
            onPin={switchToPin}
            showPinOption={errorCode !== "OUTSIDE_GEOFENCE" && errorCode !== "DUPLICATE_PUNCH"}
          />
        )}

        {/* ── PIN FALLBACK MODE ── */}
        {mode === "PIN" && (
          <PinScreen
            busy={busy}
            isOnline={isOnline}
            onSubmit={submitPinPunch}
            onBack={switchToFace}
          />
        )}

        {/* ── PRIMARY FACE SCANNER MODE ── */}
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

      {/* ─── Kiosk Footer ─── */}
      <footer className="relative z-10 px-6 py-4 border-t border-zinc-900/60 flex items-center justify-between text-[11px] text-zinc-600">
        <div className="flex items-center gap-1.5">
          <ShieldCheck className="size-3.5 text-zinc-500" />
          <span>Biometric descriptor encrypted on-device · Zero public cookie logs</span>
        </div>
        <span>Aura Engine V1.0</span>
      </footer>
    </div>
  );
}

// ─────────────────────────────────────────
// Sub-Screens & Components
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
    if (busy || cameraState === "VERIFYING") return "Verifying identity...";
    if (cameraState === "STARTING") return "Starting secure camera...";
    if (cameraState === "DENIED") return "Camera access required for Face Attendance.";
    if (cameraState === "UNAVAILABLE") return "Camera device currently unavailable.";
    if (cameraState === "FACE_DETECTED") return "Face detected — hold steady...";
    return "Look at the camera";
  })();

  return (
    <div className="w-full flex flex-col items-center gap-6 animate-in fade-in zoom-in-95 duration-200">
      
      {/* Visual Scanner Frame */}
      <div className="w-full relative">
        <div
          className={`relative w-full aspect-[4/3] rounded-3xl overflow-hidden border-2 transition-all duration-300 shadow-2xl bg-zinc-950 ${
            cameraState === "FACE_DETECTED"
              ? "border-emerald-400 shadow-[0_0_30px_rgba(16,185,129,0.25)]"
              : "border-zinc-800 shadow-[0_0_30px_rgba(0,0,0,0.5)]"
          }`}
        >
          {/* Live Video */}
          <video
            ref={videoRef}
            autoPlay muted playsInline
            className={`absolute inset-0 w-full h-full object-cover scale-x-[-1] transition-opacity duration-300 ${
              isLive && !busy ? "opacity-100" : "opacity-0"
            }`}
            aria-label="Attendance Camera"
          />

          {/* Scanner Reticle Overlay */}
          {isLive && !busy && (
            <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
              {/* Biometric Oval Guide */}
              <div
                className={`relative w-[62%] h-[80%] rounded-[48%] border-2 transition-all duration-300 ${
                  cameraState === "FACE_DETECTED"
                    ? "border-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.4)] scale-105"
                    : "border-dashed border-white/30"
                }`}
              >
                {/* Reticle Corner Brackets */}
                <div className="absolute -top-1 -left-1 size-4 border-t-2 border-l-2 border-blue-400" />
                <div className="absolute -top-1 -right-1 size-4 border-t-2 border-r-2 border-blue-400" />
                <div className="absolute -bottom-1 -left-1 size-4 border-b-2 border-l-2 border-blue-400" />
                <div className="absolute -bottom-1 -right-1 size-4 border-b-2 border-r-2 border-blue-400" />
              </div>
            </div>
          )}

          {/* Overlays */}
          {cameraState === "STARTING" && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-zinc-950/90 text-center p-6">
              <div className="size-10 rounded-full border-2 border-zinc-700 border-t-blue-500 animate-spin mb-3" />
              <p className="text-sm font-semibold text-zinc-300">Initializing camera...</p>
            </div>
          )}

          {(busy || cameraState === "VERIFYING") && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-zinc-950/85 backdrop-blur-sm text-center p-6">
              <div className="size-12 rounded-full border-3 border-zinc-700 border-t-blue-500 animate-spin mb-3" />
              <p className="text-base font-bold text-white tracking-tight">Verifying identity</p>
              <p className="text-xs text-zinc-400 mt-1">Matching biometric signature...</p>
            </div>
          )}

          {cameraState === "DENIED" && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-zinc-950 p-6 text-center">
              <div className="size-12 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400 mb-3">
                <Camera className="size-6" />
              </div>
              <p className="text-sm font-bold text-white">Camera Access Denied</p>
              <p className="text-xs text-zinc-400 mt-1 max-w-xs">Please allow browser camera permissions to enable automated face attendance.</p>
              <button
                onClick={() => window.location.reload()}
                className="mt-4 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-xs font-bold text-white transition-colors"
              >
                Reload & Allow Camera
              </button>
            </div>
          )}

          {cameraState === "UNAVAILABLE" && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-zinc-950 p-6 text-center">
              <Camera className="size-8 text-zinc-600 mb-3" />
              <p className="text-sm font-bold text-white">Camera Device Unavailable</p>
              <button
                onClick={onStartCamera}
                className="mt-4 px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-xs font-bold text-zinc-200 transition-colors"
              >
                Try Again
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Guide Banner */}
      <div className="flex flex-col items-center text-center">
        <p className={`text-base font-bold tracking-tight transition-colors ${
          busy || cameraState === "VERIFYING" 
            ? "text-blue-400 animate-pulse" 
            : cameraState === "FACE_DETECTED" 
            ? "text-emerald-400" 
            : "text-zinc-200"
        }`}>
          {statusText}
        </p>

        {/* PIN Fallback Link */}
        <div className="mt-3 flex items-center gap-2">
          <span className="text-xs text-zinc-500">Can't use Face Recognition?</span>
          <button
            onClick={onSwitchToPin}
            className="text-xs font-bold text-blue-400 hover:text-blue-300 transition-colors underline-offset-2 hover:underline cursor-pointer"
          >
            Use PIN
          </button>
        </div>
      </div>

      {/* Offline Queue Badge */}
      {!isOnline && pendingCount > 0 && (
        <div className="px-3 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-bold flex items-center gap-2">
          <span className="size-2 rounded-full bg-amber-400 animate-pulse" />
          {pendingCount} offline {pendingCount === 1 ? "punch" : "punches"} queued locally
        </div>
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
    <div className="w-full max-w-sm flex flex-col items-center gap-6 animate-in fade-in duration-200">
      <button
        onClick={onBack}
        className="self-start flex items-center gap-1.5 text-xs font-semibold text-zinc-400 hover:text-white transition-colors cursor-pointer"
      >
        <ChevronLeft className="size-4" /> Return to Face Scanner
      </button>

      <div className="text-center">
        <h2 className="text-xl font-black text-white tracking-tight">
          {step === "CODE" ? "Enter Employee ID" : "Enter PIN"}
        </h2>
        {step === "PIN" && (
          <div className="flex items-center justify-center gap-2 mt-1">
            <span className="text-xs text-zinc-400">ID: <strong className="text-white font-mono">{employeeCode}</strong></span>
            <button
              onClick={() => { setStep("CODE"); setPin(""); }}
              className="text-[11px] font-bold text-blue-400 hover:text-blue-300"
            >
              Change
            </button>
          </div>
        )}
      </div>

      {/* Input Display Box */}
      <div className="w-full h-16 rounded-2xl border border-zinc-800 bg-zinc-950 flex items-center justify-center px-6 shadow-inner">
        {step === "CODE" ? (
          <span className={`text-2xl font-mono tracking-widest font-bold ${employeeCode ? "text-white" : "text-zinc-700"}`}>
            {employeeCode || "Employee ID"}
          </span>
        ) : (
          <span className="text-3xl tracking-[0.5em] font-black text-white">
            {pin ? "•".repeat(pin.length) : <span className="text-zinc-700 text-sm tracking-normal font-sans font-medium">Enter 4-8 Digit PIN</span>}
          </span>
        )}
      </div>

      {/* Numpad Keypad */}
      <div className="grid grid-cols-3 gap-3 w-full">
        {["1","2","3","4","5","6","7","8","9"].map((d) => (
          <button
            key={d}
            onClick={() => press(d)}
            disabled={busy}
            className="h-14 rounded-2xl bg-zinc-900/80 hover:bg-zinc-800 border border-zinc-800 text-xl font-extrabold text-white transition-all active:scale-95 disabled:opacity-40 shadow-sm cursor-pointer"
          >
            {d}
          </button>
        ))}
        <button
          onClick={backspace}
          disabled={busy}
          className="h-14 rounded-2xl bg-zinc-900/60 hover:bg-zinc-800 border border-zinc-800 text-sm font-bold text-zinc-400 hover:text-rose-400 transition-all active:scale-95 disabled:opacity-40 flex items-center justify-center cursor-pointer"
        >
          ⌫ Back
        </button>
        <button
          onClick={() => press("0")}
          disabled={busy}
          className="h-14 rounded-2xl bg-zinc-900/80 hover:bg-zinc-800 border border-zinc-800 text-xl font-extrabold text-white transition-all active:scale-95 disabled:opacity-40 shadow-sm cursor-pointer"
        >
          0
        </button>
        <button
          onClick={next}
          disabled={busy || (step === "CODE" && !employeeCode) || (step === "PIN" && !pin)}
          className="h-14 rounded-2xl bg-blue-600 hover:bg-blue-500 border border-blue-500 text-base font-extrabold text-white transition-all active:scale-95 disabled:opacity-30 shadow-lg shadow-blue-900/30 flex items-center justify-center cursor-pointer"
        >
          {busy ? "..." : step === "CODE" ? "Next" : "Submit"}
        </button>
      </div>

      {!isOnline && (
        <p className="text-xs font-semibold text-amber-400 text-center">
          PIN verification requires an active internet connection.
        </p>
      )}
    </div>
  );
}

function ResultScreen({ result, onContinue }: { result: PunchResult; onContinue: () => void }) {
  const isIn = result.action === "check_in";
  const isOut = result.action === "check_out";
  const label = isIn ? "Checked In" : isOut ? "Checked Out" : "Already Recorded";
  const themeColor = isIn ? "text-emerald-400" : isOut ? "text-blue-400" : "text-amber-400";
  const themeBg = isIn ? "bg-emerald-500/10 border-emerald-500/20" : isOut ? "bg-blue-500/10 border-blue-500/20" : "bg-amber-500/10 border-amber-500/20";

  return (
    <div className="w-full max-w-sm flex flex-col items-center gap-6 text-center animate-in fade-in zoom-in-95 duration-200">
      <div className={`size-24 rounded-3xl ${themeBg} border flex items-center justify-center shadow-xl`}>
        <span className={`text-5xl font-black ${themeColor}`}>✓</span>
      </div>

      <div>
        <span className={`text-xs font-extrabold uppercase tracking-widest px-3 py-1 rounded-full border ${themeBg} ${themeColor}`}>
          Attendance Recorded
        </span>
        <h1 className={`text-3xl font-black tracking-tight mt-3 ${themeColor}`}>
          {label}
        </h1>
      </div>

      <div className="p-5 rounded-2xl bg-zinc-900/60 border border-zinc-800 w-full space-y-2">
        <p className="text-xl font-extrabold text-white">
          {result.employee.name}
        </p>
        <p className="text-xs font-mono text-zinc-400">
          ID: {result.employee.employeeCode}
        </p>
        <div className="pt-2 border-t border-zinc-800/80 flex items-center justify-between text-xs text-zinc-400">
          <span className="flex items-center gap-1"><MapPin className="size-3 text-zinc-500" /> {result.site.name}</span>
          <span className="flex items-center gap-1 font-semibold text-zinc-200"><Clock className="size-3 text-zinc-500" /> {new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
        </div>
      </div>

      <button
        onClick={onContinue}
        className="w-full py-3.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-xs font-bold text-white transition-colors cursor-pointer"
      >
        Next Employee
      </button>

      <p className="text-[11px] text-zinc-600">
        Resetting scanner automatically in 4s...
      </p>
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
    <div className="w-full max-w-sm flex flex-col items-center gap-6 text-center animate-in fade-in duration-200">
      <div className="size-20 rounded-3xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400 shadow-xl">
        <span className="text-3xl font-black">!</span>
      </div>

      <div>
        <h2 className="text-xl font-bold text-white tracking-tight">Verification Needed</h2>
        <p className="text-sm text-zinc-400 mt-2 leading-relaxed">{message}</p>
      </div>

      <div className="flex flex-col gap-3 w-full">
        <button
          onClick={onRetry}
          className="w-full py-3.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-xs font-bold text-white transition-colors flex items-center justify-center gap-2 cursor-pointer"
        >
          <RefreshCw className="size-3.5" /> Try Face Scan Again
        </button>

        {showPinOption && (
          <button
            onClick={onPin}
            className="w-full py-3.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-xs font-bold text-white shadow-lg shadow-blue-900/30 transition-colors cursor-pointer"
          >
            Use Employee PIN
          </button>
        )}
      </div>
    </div>
  );
}
