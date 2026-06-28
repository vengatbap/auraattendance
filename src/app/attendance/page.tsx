"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowRight,
  Building2,
  Camera,
  Check,
  Clock3,
  LoaderCircle,
  LocateFixed,
  LockKeyhole,
  MapPin,
  RefreshCw,
  ScanFace,
  ShieldCheck,
  TriangleAlert,
  Wifi,
  WifiOff,
  Sparkles,
  HelpCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { haversineDistance, toDateString } from "@/utils";
import { toast } from "sonner";

interface Site {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  radius: number;
}

interface Profile {
  employeeId: string;
  embedding: number[];
  name: string;
  employeeCode: string;
}

interface KioskConfig {
  id: string;
  name: string;
  allowMultiplePunches: boolean;
  minimumPunchGapMinutes: number;
  autoCheckout: boolean;
  autoCheckoutTime: string;
  gracePeriodMinutes: number;
  lateAfterTime: string;
  faceMatchThreshold: number;
}

interface LocationReading {
  latitude: number;
  longitude: number;
  accuracy: number;
}

interface PunchResult {
  action: "check_in" | "check_out" | "already_checked_out";
  matched: boolean;
  employee: { name: string; employeeCode: string };
  site: { name: string };
  faceScore: number;
  distanceMeters: number | null;
  locationMatched: boolean;
  latitude: number;
  longitude: number;
}

interface PendingPunch {
  employeeId: string;
  siteId: string | null;
  timestamp: string;
  latitude: number;
  longitude: number;
  photo?: string;
  deviceInfo?: string;
  browser?: string;
  action: "check_in" | "check_out";
  status: "present" | "late";
  faceScore: number;
  employeeName: string;
  employeeCode: string;
  siteName: string;
}

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
  const context = canvas.getContext("2d");
  if (!context) return null;
  context.drawImage(video, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL("image/jpeg", 0.86);
}

function getFreshLocation() {
  return new Promise<GeolocationPosition>((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(resolve, reject, {
      enableHighAccuracy: true,
      maximumAge: 0,
      timeout: 12_000,
    });
  });
}

async function generateDescriptor(photo: string) {
  const faceapi = await loadFaceModels();
  const image = new Image();
  image.src = photo;
  await new Promise((resolve) => {
    image.onload = resolve;
  });
  const detection = await faceapi
    .detectSingleFace(image)
    .withFaceLandmarks()
    .withFaceDescriptor();
  if (!detection) throw new Error("No face detected. Center your face and try again.");
  return Array.from(detection.descriptor);
}

// Helper function for local matching (pure logic, extracted from component to prevent closure warning)
function matchLocalEmbedding(descriptor: number[], cachedProfiles: Profile[], faceMatchThreshold = 0.6) {
  if (cachedProfiles.length === 0) return null;

  let bestMatch: { profile: Profile; distance: number } | null = null;

  for (const profile of cachedProfiles) {
    const target = profile.embedding;
    let sum = 0;
    for (let i = 0; i < descriptor.length; i++) {
      sum += Math.pow(descriptor[i] - target[i], 2);
    }
    const distance = Math.sqrt(sum);

    if (!bestMatch || distance < bestMatch.distance) {
      bestMatch = { profile, distance };
    }
  }

  if (bestMatch && bestMatch.distance <= faceMatchThreshold) {
    return {
      employeeId: bestMatch.profile.employeeId,
      name: bestMatch.profile.name,
      employeeCode: bestMatch.profile.employeeCode,
      score: 1 - bestMatch.distance,
    };
  }

  return null;
}

// Extracted offline punch calculations to keep components clean
function processOfflinePunch(
  descriptor: number[],
  coords: { latitude: number; longitude: number },
  photo: string,
  cachedProfiles: Profile[],
  sites: Site[],
  kioskConfig: KioskConfig | null
): PunchResult {
  // 1. Match embedding
  const match = matchLocalEmbedding(descriptor, cachedProfiles, kioskConfig?.faceMatchThreshold);
  if (!match) throw new Error("Face not recognized locally");

  // 2. Geofence Site Detection
  const nearest = sites
    .map((candidate) => ({
      site: candidate,
      distance: haversineDistance(
        coords.latitude,
        coords.longitude,
        candidate.latitude,
        candidate.longitude
      ),
    }))
    .sort((a, b) => a.distance - b.distance)[0];

  const matchedSite =
    nearest && nearest.distance <= nearest.site.radius ? nearest.site : null;
  const distance = nearest?.distance ?? null;

  const siteResult = matchedSite
    ? { id: matchedSite.id, name: matchedSite.name, matched: true }
    : { id: null, name: "Unknown location", matched: false };

  // 3. Determine check-in / check-out action based on locally queued punches for today
  const today = toDateString();
  const queuedPunchesRaw = localStorage.getItem("aura_pending_punches") || "[]";
  const queue: PendingPunch[] = JSON.parse(queuedPunchesRaw);

  const existingToday = queue.find(
    (p) => p.employeeId === match.employeeId && p.timestamp.startsWith(today)
  );

  let action: "check_in" | "check_out" | "already_checked_out" = "check_in";
  if (existingToday) {
    if (existingToday.action === "check_in") {
      action = "check_out";
    } else {
      action = "already_checked_out";
    }
  }

  // 4. Late calculations
  const [lateHour, lateMinute] = (kioskConfig?.lateAfterTime || "09:15")
    .split(":")
    .map(Number);
  const grace = kioskConfig?.gracePeriodMinutes ?? 15;
  const lateLimitMinutes = lateHour * 60 + lateMinute + grace;

  const nowTime = new Date();
  const currentMinutes = nowTime.getHours() * 60 + nowTime.getMinutes();
  const status: "present" | "late" = currentMinutes > lateLimitMinutes ? "late" : "present";

  if (action !== "already_checked_out") {
    const newPendingPunch: PendingPunch = {
      employeeId: match.employeeId,
      siteId: siteResult.id,
      timestamp: nowTime.toISOString(),
      latitude: coords.latitude,
      longitude: coords.longitude,
      photo,
      deviceInfo: navigator.platform,
      browser: navigator.userAgent,
      action: action === "check_in" ? "check_in" : "check_out",
      status,
      faceScore: match.score,
      employeeName: match.name,
      employeeCode: match.employeeCode,
      siteName: siteResult.name,
    };

    queue.push(newPendingPunch);
    localStorage.setItem("aura_pending_punches", JSON.stringify(queue));
  }

  return {
    action,
    matched: true,
    employee: { name: match.name, employeeCode: match.employeeCode },
    site: { name: siteResult.name },
    faceScore: match.score,
    distanceMeters: distance,
    locationMatched: Boolean(matchedSite),
    latitude: coords.latitude,
    longitude: coords.longitude,
  };
}

export default function AttendancePunchPage() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // States with lazy initializers to avoid mount-time synchronous state triggers
  const [isOnline, setIsOnline] = useState(() => typeof window !== "undefined" ? navigator.onLine : true);

  const [sites, setSites] = useState<Site[]>(() => {
    if (typeof window === "undefined") return [];
    try {
      const cached = localStorage.getItem("aura_kiosk_sites");
      return cached ? JSON.parse(cached) : [];
    } catch {
      return [];
    }
  });

  const [cachedProfiles, setCachedProfiles] = useState<Profile[]>(() => {
    if (typeof window === "undefined") return [];
    try {
      const cached = localStorage.getItem("aura_kiosk_profiles");
      return cached ? JSON.parse(cached) : [];
    } catch {
      return [];
    }
  });

  const [kioskConfig, setKioskConfig] = useState<KioskConfig | null>(() => {
    if (typeof window === "undefined") return null;
    try {
      const cached = localStorage.getItem("aura_kiosk_config");
      return cached ? JSON.parse(cached) : null;
    } catch {
      return null;
    }
  });

  const [pendingCount, setPendingCount] = useState<number>(() => {
    if (typeof window === "undefined") return 0;
    try {
      const cached = localStorage.getItem("aura_pending_punches");
      return cached ? JSON.parse(cached).length : 0;
    } catch {
      return 0;
    }
  });

  const [location, setLocation] = useState<LocationReading | null>(null);
  const [locationBusy, setLocationBusy] = useState(true);
  const [streaming, setStreaming] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<PunchResult | null>(null);
  const [now, setNow] = useState(() => new Date());
  const [autoCaptureStatus, setAutoCaptureStatus] = useState<string>("");

  // Demo walkthrough steps
  const [showWalkthrough, setShowWalkthrough] = useState(false);
  const [walkthroughStep, setWalkthroughStep] = useState(0);

  // Stop Webcam
  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
    setStreaming(false);
  }, []);

  // Request GPS Location
  const requestLocation = useCallback(async () => {
    setLocationBusy(true);
    setError("");
    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          maximumAge: 15_000,
          timeout: 12_000,
        });
      });
      setLocation({
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        accuracy: position.coords.accuracy,
      });
    } catch {
      setLocation(null);
      setError("Location access is required to bind attendance to an approved site.");
    } finally {
      setLocationBusy(false);
    }
  }, []);

  // Start Camera
  const startCamera = useCallback(async () => {
    setError("");
    setResult(null);
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
      setStreaming(true);
      void loadFaceModels().catch(() => setError("Face recognition models could not be loaded."));
    } catch {
      setError("Camera access is required to verify your identity. Please enable permissions.");
    }
  }, []);

  // Sync queued offline punches to server
  const syncOfflineQueue = useCallback(async () => {
    if (!navigator.onLine) return;
    try {
      const queued = localStorage.getItem("aura_pending_punches");
      if (!queued) return;

      const queue: PendingPunch[] = JSON.parse(queued);
      if (queue.length === 0) return;

      const res = await fetch("/api/attendance/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(queue),
      });

      if (res.ok) {
        localStorage.removeItem("aura_pending_punches");
        setPendingCount(0);
        toast.success(`Successfully synchronized ${queue.length} offline punches!`);
      }
    } catch (err) {
      console.warn("Background sync failed", err);
    }
  }, []);

  // Fetch Kiosk Profiles & settings from server (when online)
  const syncFromServer = useCallback(async () => {
    if (!navigator.onLine) return;

    try {
      const searchParams = new URLSearchParams(window.location.search);
      const org = searchParams.get("org") || "aura-demo";
      const orgId = searchParams.get("organizationId");

      const url = new URL("/api/attendance/kiosk-sync", window.location.origin);
      if (org) url.searchParams.set("org", org);
      if (orgId) url.searchParams.set("organizationId", orgId);

      const res = await fetch(url.toString());
      if (!res.ok) throw new Error();

      const resultData = await res.json();
      if (resultData.success && resultData.data) {
        const { config, sites: syncedSites, profiles } = resultData.data;

        localStorage.setItem("aura_kiosk_config", JSON.stringify(config));
        localStorage.setItem("aura_kiosk_sites", JSON.stringify(syncedSites));
        localStorage.setItem("aura_kiosk_profiles", JSON.stringify(profiles));

        setKioskConfig(config);
        setSites(syncedSites);
        setCachedProfiles(profiles);

        // Run sync queue
        void syncOfflineQueue();
      }
    } catch {
      console.warn("Unable to fetch latest settings from server, using local cache");
    }
  }, [syncOfflineQueue]);

  // Handle Online/Offline Status Changes
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      void syncFromServer();
    };
    const handleOffline = () => {
      setIsOnline(false);
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [syncFromServer]);

  // Main Punch Action Trigger
  const submitPunch = useCallback(async () => {
    setBusy(true);
    setError("");
    setResult(null);
    setAutoCaptureStatus("");

    try {
      const photo = capturePhoto(videoRef.current, canvasRef.current);
      if (!photo) throw new Error("The camera is not ready yet.");

      let position: GeolocationPosition;
      try {
        position = await getFreshLocation();
      } catch {
        throw new Error("Unable to read GPS location. Location is required.");
      }

      const descriptor = await generateDescriptor(photo);

      // Offline path
      if (!navigator.onLine) {
        const localRes = processOfflinePunch(
          descriptor,
          { latitude: position.coords.latitude, longitude: position.coords.longitude },
          photo,
          cachedProfiles,
          sites,
          kioskConfig
        );
        setResult(localRes);
        stopCamera();
        const cachedRaw = localStorage.getItem("aura_pending_punches") || "[]";
        const parsedQueue = JSON.parse(cachedRaw);
        setPendingCount(parsedQueue.length);
        toast.info("Offline punch saved locally. Will sync when online.");
        return;
      }

      // Online path
      const searchParams = new URLSearchParams(window.location.search);
      const org = searchParams.get("org") || "aura-demo";
      const orgId = searchParams.get("organizationId");

      const response = await fetch("/api/attendance/punch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          descriptor,
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          photo,
          browser: navigator.userAgent,
          deviceInfo: navigator.platform,
          organizationId: orgId || undefined,
          orgSlug: org || undefined,
        }),
      });

      const resResult = await response.json();
      if (!response.ok || !resResult.success) {
        throw new Error(resResult.message || "Attendance could not be recorded.");
      }

      setResult(resResult.data);
      stopCamera();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Attendance failed.");
      if (!streamRef.current) {
        void startCamera();
      }
    } finally {
      setBusy(false);
    }
  }, [startCamera, stopCamera, cachedProfiles, sites, kioskConfig]);

  // Initialization
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void syncFromServer();
    void requestLocation();
    void startCamera();

    const clock = window.setInterval(() => setNow(new Date()), 1000);
    // Background sync loop
    const syncLoop = window.setInterval(() => void syncOfflineQueue(), 12000);

    return () => {
      window.clearInterval(clock);
      window.clearInterval(syncLoop);
      streamRef.current?.getTracks().forEach((track) => track.stop());
    };
  }, [requestLocation, startCamera, syncFromServer, syncOfflineQueue]);

  // Find nearest site
  const nearestSite = useMemo(() => {
    if (!location || sites.length === 0) return null;
    return sites
      .map((site) => ({
        ...site,
        distance: haversineDistance(
          location.latitude,
          location.longitude,
          site.latitude,
          site.longitude
        ),
      }))
      .sort((a, b) => a.distance - b.distance)[0];
  }, [location, sites]);

  const isInsideGeofence = Boolean(
    nearestSite && nearestSite.distance <= nearestSite.radius
  );

  // Auto camera-tracking
  useEffect(() => {
    if (!streaming || busy || result) {
      // Defer state update to avoid synchronous cascades in effect
      Promise.resolve().then(() => setAutoCaptureStatus(""));
      return;
    }

    let active = true;
    let holdStart: number | null = null;

    async function autoTrack() {
      if (!active || !videoRef.current) return;
      try {
        const faceapi = await loadFaceModels();
        const detection = await faceapi.detectSingleFace(
          videoRef.current,
          new faceapi.SsdMobilenetv1Options({ minConfidence: 0.85 })
        );

        if (detection) {
          if (!holdStart) {
            holdStart = Date.now();
            setAutoCaptureStatus("Face found! Hold steady...");
          } else {
            const elapsed = Date.now() - holdStart;
            if (elapsed >= 1500) {
              active = false;
              setAutoCaptureStatus("Verifying identity...");
              void submitPunch();
              return;
            }
          }
        } else {
          holdStart = null;
          setAutoCaptureStatus("Position your face clearly in the camera");
        }
      } catch {
        // Skip frame
      }

      if (active) {
        setTimeout(autoTrack, 400);
      }
    }

    void autoTrack();

    return () => {
      active = false;
    };
  }, [streaming, busy, result, submitPunch]);

  // Reset Kiosk
  function reset() {
    stopCamera();
    setResult(null);
    setError("");
    void requestLocation();
    void startCamera();
  }

  // Walkthrough Guides trigger
  function handleNextWalkthrough() {
    if (walkthroughStep < 3) {
      setWalkthroughStep((prev) => prev + 1);
    } else {
      setShowWalkthrough(false);
      setWalkthroughStep(0);
      toast.success("Walkthrough guide completed! Aura is ready for testing.");
    }
  }

  const actionLabel =
    result?.action === "check_in"
      ? "Check-in complete"
      : result?.action === "check_out"
      ? "Check-out complete"
      : "Attendance already complete";

  return (
    <main className="relative min-h-screen overflow-hidden bg-slate-950 text-slate-100 flex flex-col justify-between">
      {/* Background gradients */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_15%_15%,#1e3a8a_0%,transparent_32%),radial-gradient(circle_at_85%_75%,#311042_0%,transparent_30%)]" />

      {/* Walkthrough Modal Overlay */}
      {showWalkthrough && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3rem p-6 max-w-sm w-full shadow-2xl relative">
            <div className="absolute -top-6 left-6 flex size-12 items-center justify-center rounded-2xl bg-blue-600 shadow-lg text-white">
              <Sparkles className="size-6" />
            </div>
            <div className="mt-4 space-y-4">
              <div className="flex justify-between items-center text-xs font-semibold text-slate-500 uppercase tracking-widest">
                <span>Walkthrough Guide</span>
                <span>{walkthroughStep + 1} / 4</span>
              </div>

              {walkthroughStep === 0 && (
                <div>
                  <h3 className="text-lg font-bold text-white">1. Verify Geolocation</h3>
                  <p className="mt-2 text-slate-400 text-sm leading-6">
                    Aura automatically checks if your device is located within the GPS boundary of an approved site. Ensure location services are allowed.
                  </p>
                </div>
              )}

              {walkthroughStep === 1 && (
                <div>
                  <h3 className="text-lg font-bold text-white">2. Stand Well-lit</h3>
                  <p className="mt-2 text-slate-400 text-sm leading-6">
                    Aura uses ambient light checking. Position your face in a bright environment. Avoid strong backlighting.
                  </p>
                </div>
              )}

              {walkthroughStep === 2 && (
                <div>
                  <h3 className="text-lg font-bold text-white">3. Face Alignment</h3>
                  <p className="mt-2 text-slate-400 text-sm leading-6">
                    Keep your face within the camera guideline frame. The AI scanner begins analysis automatically when a face is detected.
                  </p>
                </div>
              )}

              {walkthroughStep === 3 && (
                <div>
                  <h3 className="text-lg font-bold text-white">4. Hold Steady</h3>
                  <p className="mt-2 text-slate-400 text-sm leading-6">
                    Hold still for 1.5 seconds. Once verified, you will see a check-in success overlay.
                  </p>
                </div>
              )}

              <Button onClick={handleNextWalkthrough} className="w-full bg-blue-600 hover:bg-blue-700 h-11 rounded-2xl font-bold">
                {walkthroughStep < 3 ? "Next Step" : "Get Started"}
                <ArrowRight className="size-4 ml-2" />
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <header className="relative z-10 mx-auto w-full max-w-7xl px-4 py-5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex size-11 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-xl shadow-blue-600/30">
            <ScanFace className="size-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold tracking-tight text-white">Aura Kiosk</span>
              {isOnline ? (
                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  <Wifi className="size-2.5 animate-pulse" /> Online
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase bg-amber-500/10 text-amber-400 border border-amber-500/20">
                  <WifiOff className="size-2.5" /> Offline Mode
                </span>
              )}
            </div>
            <p className="text-[10px] font-medium text-slate-500">
              {pendingCount > 0 ? `${pendingCount} punches in offline queue` : "Secure attendance node"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            onClick={() => {
              setWalkthroughStep(0);
              setShowWalkthrough(true);
            }}
            className="flex items-center gap-2 rounded-full border border-slate-800 bg-slate-950/40 text-slate-400 hover:text-white"
          >
            <HelpCircle className="size-4" />
            Walkthrough
          </Button>
          <Link
            href="/login"
            className="flex items-center gap-2 rounded-full border border-slate-800 bg-slate-950/40 px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white shadow-sm backdrop-blur transition"
          >
            <LockKeyhole className="size-3.5" />
            Admin Portal
          </Link>
        </div>
      </header>

      {/* Main Grid */}
      <div className="relative z-10 mx-auto w-full max-w-7xl px-4 flex-1 grid items-center gap-8 py-4 lg:grid-cols-[0.95fr_1.05fr] lg:gap-16">
        {/* Left column info */}
        <section className="order-2 lg:order-1 text-left">
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-blue-950 bg-blue-500/10 px-3.5 py-1.5 text-xs font-semibold text-blue-400">
            <ShieldCheck className="size-4 text-blue-500" />
            Secure Biometric Attendance
          </div>
          <h1 className="max-w-xl text-4xl font-bold leading-[1.08] tracking-[-0.04em] sm:text-5xl lg:text-6xl text-white">
            Instant check-in
            <span className="text-blue-500 block mt-1">without the badges.</span>
          </h1>
          <p className="mt-5 max-w-lg text-sm leading-6 text-slate-400">
            Mount any device on your wall as a smart terminal. Employees punch in using facial recognition, auto-detecting the geofenced site boundary.
          </p>

          <div className="mt-8 grid max-w-lg gap-3 sm:grid-cols-3">
            <div className="rounded-2xl border border-slate-900 bg-slate-950/30 p-4 backdrop-blur shadow-sm">
              <ScanFace className="mb-2 size-5 text-blue-500" />
              <p className="text-xs font-bold text-slate-200">Face Recognition</p>
              <p className="mt-1 text-[10px] text-slate-500">Biometric identity match</p>
            </div>
            <div className="rounded-2xl border border-slate-900 bg-slate-950/30 p-4 backdrop-blur shadow-sm">
              <LocateFixed className="mb-2 size-5 text-blue-500" />
              <p className="text-xs font-bold text-slate-200">GPS Auto-Match</p>
              <p className="mt-1 text-[10px] text-slate-500">Inside geofence zones</p>
            </div>
            <div className="rounded-2xl border border-slate-900 bg-slate-950/30 p-4 backdrop-blur shadow-sm">
              <Wifi className="mb-2 size-5 text-blue-500" />
              <p className="text-xs font-bold text-slate-200">Offline Caching</p>
              <p className="mt-1 text-[10px] text-slate-500">Zero downtime support</p>
            </div>
          </div>
        </section>

        {/* Right column camera card */}
        <section className="order-1 lg:order-2">
          <div className="mx-auto w-full max-w-xl overflow-hidden rounded-[2.5rem] border border-slate-900 bg-slate-900/60 shadow-2xl shadow-black/40 backdrop-blur-xl">
            {/* Card Header info */}
            <div className="flex items-center justify-between border-b border-slate-900 px-5 py-4">
              <div>
                <p className="text-sm font-bold text-white">Punch Scanner</p>
                <p className="mt-0.5 text-xs text-slate-500">
                  {now.toLocaleDateString(undefined, { weekday: "long", month: "short", day: "numeric" })}
                </p>
              </div>
              <div className="flex items-center gap-2 rounded-full bg-slate-950 border border-slate-800 px-3.5 py-1.5 font-mono text-xs font-bold text-slate-300">
                <Clock3 className="size-3.5 text-blue-500" />
                {now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
              </div>
            </div>

            {/* Video container */}
            <div className="p-4 sm:p-5">
              <canvas ref={canvasRef} className="hidden" />
              <div className="relative aspect-[4/3] overflow-hidden rounded-3xl bg-slate-950 border border-slate-900">
                <video
                  ref={videoRef}
                  autoPlay
                  muted
                  playsInline
                  className={`h-full w-full scale-x-[-1] object-cover transition-opacity duration-300 ${streaming ? "opacity-100" : "opacity-0"}`}
                />

                {!streaming && !result && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-[radial-gradient(circle_at_center,#0f172a_0%,#020617_80%)] text-center">
                    <div className="relative mb-5">
                      <div className="absolute inset-0 animate-ping rounded-full bg-blue-500/20" />
                      <div className="relative flex size-16 items-center justify-center rounded-full border border-blue-400/30 bg-blue-500/10 text-blue-400">
                        <Camera className="size-7 animate-pulse" />
                      </div>
                    </div>
                    <p className="text-sm font-bold text-white">Initializing scanner camera...</p>
                    <p className="mt-1.5 max-w-xs text-[11px] leading-5 text-slate-500">
                      Grant browser access to your device camera to proceed.
                    </p>
                  </div>
                )}

                {streaming && (
                  <>
                    {/* Centered Guide Circle */}
                    <div
                      className="pointer-events-none absolute inset-[12%_22%] rounded-[42%] border-2 border-dashed border-white/40 shadow-[0_0_0_999px_rgba(2,6,23,0.3)] transition-all duration-300 data-[highlight=true]:border-emerald-400 data-[highlight=true]:scale-105"
                      data-highlight={autoCaptureStatus.includes("Hold") || autoCaptureStatus.includes("Verifying")}
                    />
                    {/* Auto Capture Status Overlay */}
                    <div className="absolute left-4 top-4 flex items-center gap-2 rounded-full bg-slate-950/80 border border-slate-800 px-3 py-1.5 text-[10px] font-bold text-white backdrop-blur">
                      <span className={`size-1.5 animate-pulse rounded-full ${autoCaptureStatus.includes("Hold") ? "bg-emerald-400" : "bg-blue-400"}`} />
                      {autoCaptureStatus || "Camera ready"}
                    </div>
                    {autoCaptureStatus.includes("Hold") && (
                      <div className="absolute inset-x-0 bottom-8 flex justify-center animate-bounce">
                        <span className="rounded-full bg-slate-950/85 border border-slate-800 px-4 py-2 text-xs font-bold text-emerald-400 shadow-xl backdrop-blur-md">
                          {autoCaptureStatus}
                        </span>
                      </div>
                    )}
                  </>
                )}

                {/* Successful punch result overlays */}
                {result && (
                  <div
                    className={`absolute inset-0 flex flex-col items-center justify-center px-6 text-center text-white transition-opacity duration-300 ${
                      result.action === "check_in"
                        ? "bg-gradient-to-br from-emerald-950 via-slate-950 to-slate-950"
                        : result.action === "check_out"
                        ? "bg-gradient-to-br from-blue-950 via-slate-950 to-slate-950"
                        : "bg-gradient-to-br from-amber-950 via-slate-950 to-slate-950"
                    }`}
                  >
                    <div
                      className={`mb-4 flex size-20 items-center justify-center rounded-3xl text-slate-950 shadow-xl ${
                        result.action === "check_in"
                          ? "bg-emerald-400 shadow-emerald-500/20"
                          : result.action === "check_out"
                          ? "bg-blue-400 shadow-blue-500/20"
                          : "bg-amber-400 shadow-amber-500/20"
                      }`}
                    >
                      <Check className="size-10 stroke-[3]" />
                    </div>
                    <p className="text-2xl font-bold tracking-tight text-white">{actionLabel}</p>
                    <p className="mt-3 text-lg font-semibold text-slate-300">
                      {result.employee.name}
                    </p>
                    <p className="mt-1 text-xs text-slate-500 font-mono">
                      ID: {result.employee.employeeCode} · {result.site.name}
                    </p>
                    <p className="mt-6 text-[10px] text-slate-600 border border-slate-900 rounded-full px-3 py-1 bg-slate-950/60">
                      Face Quality Match: {(result.faceScore * 100).toFixed(1)}% ·{" "}
                      {result.locationMatched && result.distanceMeters != null
                        ? `${Math.round(result.distanceMeters)}m from boundary`
                        : `GPS: ${result.latitude.toFixed(5)}, ${result.longitude.toFixed(5)}`}
                    </p>
                  </div>
                )}
              </div>

              {/* Status and Diagnostics */}
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <StatusCard
                  active={isInsideGeofence}
                  loading={locationBusy}
                  title={locationBusy ? "Reading GPS…" : isInsideGeofence ? "Valid workplace zone" : "Outside approved zone"}
                  detail={nearestSite ? `${nearestSite.name} · ${Math.round(nearestSite.distance)}m away` : "GPS matching active"}
                />
                <div className="rounded-2xl border border-slate-900 bg-slate-950/30 p-3.5 flex items-start gap-3 shadow-sm">
                  <div className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg bg-slate-950 border border-slate-800 text-slate-400">
                    <Building2 className="size-4" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-200">Device Verification</p>
                    <p className="mt-1 text-[10px] text-slate-500 leading-4">
                      Instant matching using local device GPU descriptors.
                    </p>
                  </div>
                </div>
              </div>

              {error && (
                <div className="mt-4 flex items-start gap-3 rounded-2xl border border-red-950 bg-red-950/10 px-4 py-3.5 text-xs text-red-400">
                  <TriangleAlert className="mt-0.5 size-4 shrink-0 text-red-500" />
                  <span className="leading-5">{error}</span>
                </div>
              )}

              {/* Controls */}
              <div className="mt-5 flex gap-3">
                {result ? (
                  <Button onClick={reset} className="h-12 w-full rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold">
                    <RefreshCw className="size-4 mr-2" />
                    Scan Next Person
                  </Button>
                ) : !streaming ? (
                  <Button onClick={startCamera} className="h-12 w-full rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-lg shadow-blue-600/20">
                    <Camera className="size-4 mr-2" />
                    Activate Scanner
                    <ArrowRight className="ml-auto size-4" />
                  </Button>
                ) : (
                  <>
                    <Button
                      variant="outline"
                      onClick={stopCamera}
                      disabled={busy}
                      className="h-12 flex-1 rounded-2xl border-slate-800 bg-transparent text-slate-400 hover:text-white"
                    >
                      Pause Scanner
                    </Button>
                    <div className="flex items-center justify-center px-4">
                      {busy && <LoaderCircle className="size-6 animate-spin text-blue-500" />}
                    </div>
                  </>
                )}
              </div>

              {!locationBusy && !location && (
                <button
                  onClick={() => void requestLocation()}
                  className="mt-4 flex w-full items-center justify-center gap-2 text-xs font-semibold text-blue-500 hover:text-blue-400"
                >
                  <LocateFixed className="size-3.5 animate-pulse" />
                  Retry Location Reading
                </button>
              )}
            </div>
          </div>
        </section>
      </div>

      {/* Footer */}
      <footer className="relative z-10 flex items-center justify-center gap-2 pb-5 text-[10px] text-slate-600 uppercase tracking-widest mt-4">
        <ShieldCheck className="size-4 text-slate-500" />
        Local device encrypted verification · Zero logs stored on public cookies
      </footer>
    </main>
  );
}

function StatusCard({
  active,
  loading,
  title,
  detail,
}: {
  active: boolean;
  loading: boolean;
  title: string;
  detail: string;
}) {
  return (
    <div
      className={`rounded-2xl border p-3.5 flex items-start gap-3 shadow-sm transition-colors ${
        active
          ? "border-emerald-950 bg-emerald-950/15"
          : "border-slate-900 bg-slate-950/30"
      }`}
    >
      <div
        className={`mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg ${
          active ? "bg-emerald-500/10 text-emerald-400" : "bg-slate-950 border border-slate-800 text-slate-500"
        }`}
      >
        {loading ? <LoaderCircle className="size-4 animate-spin text-blue-500" /> : <MapPin className="size-4" />}
      </div>
      <div className="min-w-0">
        <p className={`text-xs font-bold ${active ? "text-emerald-400" : "text-slate-300"}`}>{title}</p>
        <p className="mt-1 truncate text-[10px] text-slate-500 leading-4">{detail}</p>
      </div>
    </div>
  );
}
