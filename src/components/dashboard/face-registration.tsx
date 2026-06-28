"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  ArrowRight,
  Camera,
  Check,
  CheckCircle2,
  ChevronLeft,
  Images,
  LoaderCircle,
  RefreshCw,
  ScanFace,
  ShieldCheck,
  Sparkles,
  Trash2,
  TriangleAlert,
  Video,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

const FACE_MODEL_URL = "https://justadudewhohacks.github.io/face-api.js/models";
const CAPTURE_STEPS = [
  { title: "Look straight", detail: "Center your face and keep a neutral expression." },
  { title: "Turn slightly left", detail: "Move slowly and keep both eyes visible." },
  { title: "Turn slightly right", detail: "Keep your face inside the guide." },
  { title: "Lift your chin", detail: "A small upward tilt is enough." },
  { title: "Final neutral pose", detail: "Look straight ahead for the final sample." },
];

type FaceApi = typeof import("@vladmandic/face-api");
let faceModelsPromise: Promise<FaceApi> | null = null;

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

interface FaceSample {
  image: string;
  descriptor: number[];
}

interface FaceRegistrationProps {
  employeeId: string;
  employeeName?: string;
  employeeCode?: string;
  onSuccess?: () => void;
}

export function FaceRegistration({
  employeeId,
  employeeName,
  employeeCode,
  onSuccess,
}: FaceRegistrationProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [modelsReady, setModelsReady] = useState(false);
  const [samples, setSamples] = useState<FaceSample[]>([]);
  const [capturing, setCapturing] = useState(false);
  const [registering, setRegistering] = useState(false);
  const [registered, setRegistered] = useState(false);
  const [error, setError] = useState("");

  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
    setCameraActive(false);
  }, []);

  useEffect(() => () => stopCamera(), [stopCamera]);

  async function startCamera() {
    setError("");
    setRegistered(false);
    try {
      const [stream] = await Promise.all([
        navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: "user",
            width: { ideal: 1280 },
            height: { ideal: 960 },
          },
          audio: false,
        }),
        loadFaceModels().then(() => setModelsReady(true)),
      ]);

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setCameraActive(true);
    } catch {
      setError("Camera access or face recognition models are unavailable.");
    }
  }

  async function captureSample() {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || !video.videoWidth || !modelsReady) return;

    setCapturing(true);
    setError("");
    try {
      const faceapi = await loadFaceModels();
      const detection = await faceapi
        .detectSingleFace(video)
        .withFaceLandmarks()
        .withFaceDescriptor();

      if (!detection) {
        throw new Error("No clear face detected. Improve lighting and face the camera.");
      }

      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const context = canvas.getContext("2d");
      if (!context) throw new Error("Unable to capture this frame.");
      context.drawImage(video, 0, 0, canvas.width, canvas.height);

      // Ambient light check
      const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
      const pixels = imageData.data;
      let lumaSum = 0;
      for (let i = 0; i < pixels.length; i += 4) {
        lumaSum += 0.2126 * pixels[i] + 0.7152 * pixels[i + 1] + 0.0722 * pixels[i + 2];
      }
      const avgLuma = lumaSum / (canvas.width * canvas.height);
      if (avgLuma < 45) {
        throw new Error(`Lighting is too dark (${Math.round(avgLuma)}/255). Please move to a brighter environment.`);
      }

      setSamples((current) => [
        ...current,
        {
          image: canvas.toDataURL("image/jpeg", 0.88),
          descriptor: Array.from(detection.descriptor),
        },
      ]);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Capture failed.");
    } finally {
      setCapturing(false);
    }
  }

  function removeSample(index: number) {
    setSamples((current) => current.filter((_, sampleIndex) => sampleIndex !== index));
    setRegistered(false);
  }

  async function registerFace() {
    if (samples.length < CAPTURE_STEPS.length) {
      setError(`Capture all ${CAPTURE_STEPS.length} face angles before registering.`);
      return;
    }

    setRegistering(true);
    setError("");
    try {
      const descriptor = samples[0].descriptor.map(
        (_, index) =>
          samples.reduce((sum, sample) => sum + sample.descriptor[index], 0) /
          samples.length
      );

      const response = await fetch("/api/faces/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          employeeId,
          descriptor,
          images: samples.map((sample) => sample.image),
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Failed to register face.");

      setRegistered(true);
      stopCamera();
      toast.success("Face profile registered");
      onSuccess?.();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Failed to register face.");
    } finally {
      setRegistering(false);
    }
  }

  function resetCapture() {
    stopCamera();
    setSamples([]);
    setRegistered(false);
    setModelsReady(false);
    setError("");
  }

  const currentStep = CAPTURE_STEPS[Math.min(samples.length, CAPTURE_STEPS.length - 1)];
  const complete = samples.length === CAPTURE_STEPS.length;
  const progress = (samples.length / CAPTURE_STEPS.length) * 100;

  if (registered) {
    return (
      <div className="overflow-hidden rounded-[2rem] border border-emerald-400/20 bg-emerald-950/40 shadow-2xl shadow-black/20">
        <div className="flex min-h-[460px] flex-col items-center justify-center px-6 py-12 text-center">
          <div className="relative mb-6">
            <div className="absolute inset-0 animate-ping rounded-full bg-emerald-400/15" />
            <div className="relative flex size-20 items-center justify-center rounded-full bg-emerald-400 text-emerald-950 shadow-xl shadow-emerald-950/40">
              <Check className="size-10 stroke-[3]" />
            </div>
          </div>
          <span className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1 text-xs font-semibold text-emerald-300">
            Enrollment complete
          </span>
          <h2 className="mt-4 text-3xl font-bold tracking-tight text-white">Face profile registered</h2>
          <p className="mt-3 max-w-md text-sm leading-6 text-emerald-100/70">
            {employeeName || "This employee"} can now use face verification at the attendance kiosk.
          </p>
          <div className="mt-8 flex w-full max-w-sm gap-3">
            <Button
              variant="outline"
              onClick={resetCapture}
              className="h-11 flex-1 border-emerald-400/20 bg-transparent text-emerald-100 hover:bg-emerald-400/10"
            >
              <RefreshCw className="size-4" />
              Capture again
            </Button>
            <Button
              onClick={() => window.location.assign("/dashboard/employees")}
              className="h-11 flex-1 bg-emerald-400 text-emerald-950 hover:bg-emerald-300"
            >
              Done
              <ArrowRight className="size-4" />
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="grid overflow-hidden rounded-[2rem] border border-slate-800 bg-slate-900 shadow-2xl shadow-black/20 lg:grid-cols-[1.35fr_0.65fr]">
      <div className="border-b border-slate-800 p-4 sm:p-6 lg:border-b-0 lg:border-r">
        <canvas ref={canvasRef} className="hidden" />
        <div className="relative aspect-[4/3] overflow-hidden rounded-2xl bg-slate-950">
          <video
            ref={videoRef}
            autoPlay
            muted
            playsInline
            className={`h-full w-full scale-x-[-1] object-cover transition-opacity duration-300 ${
              cameraActive ? "opacity-100" : "opacity-0"
            }`}
          />

          {!cameraActive && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-[radial-gradient(circle_at_center,#1e293b_0%,#020617_72%)] px-6 text-center">
              <div className="relative mb-5">
                <div className="absolute inset-0 animate-ping rounded-full bg-blue-500/20" />
                <div className="relative flex size-20 items-center justify-center rounded-full border border-blue-400/30 bg-blue-500/15 text-blue-300">
                  <Video className="size-8" />
                </div>
              </div>
              <p className="text-lg font-bold text-white">Start face capture</p>
              <p className="mt-2 max-w-xs text-sm leading-6 text-slate-400">
                We&apos;ll guide you through five quick angles for reliable recognition.
              </p>
            </div>
          )}

          {cameraActive && (
            <>
              <div className="pointer-events-none absolute inset-[10%_23%] rounded-[44%] border-2 border-white/70 shadow-[0_0_0_999px_rgba(2,6,23,0.24)]" />
              <div className="absolute left-4 top-4 flex items-center gap-2 rounded-full bg-slate-950/70 px-3 py-1.5 text-[11px] font-semibold text-white backdrop-blur">
                <span className="size-1.5 animate-pulse rounded-full bg-emerald-400" />
                Camera live
              </div>
              <div className="absolute inset-x-4 bottom-4 rounded-2xl bg-slate-950/75 p-4 text-center text-white backdrop-blur-md">
                <p className="text-sm font-bold">{complete ? "All angles captured" : currentStep.title}</p>
                <p className="mt-1 text-xs text-slate-300">
                  {complete ? "Review the samples, then register the profile." : currentStep.detail}
                </p>
              </div>
            </>
          )}
        </div>

        {error && (
          <div className="mt-4 flex items-start gap-3 rounded-xl border border-red-400/20 bg-red-500/10 px-4 py-3 text-xs text-red-200">
            <TriangleAlert className="mt-0.5 size-4 shrink-0" />
            <span className="leading-5">{error}</span>
          </div>
        )}

        <div className="mt-5 flex gap-3">
          {!cameraActive ? (
            <Button
              onClick={startCamera}
              className="h-12 w-full rounded-xl bg-blue-600 text-white shadow-lg shadow-blue-950/30 hover:bg-blue-500"
            >
              <Camera className="size-4" />
              Open camera
              <ArrowRight className="ml-auto size-4" />
            </Button>
          ) : (
            <>
              <Button
                variant="outline"
                onClick={stopCamera}
                disabled={capturing || registering}
                className="h-12 rounded-xl border-slate-700 bg-slate-950/40 px-5 text-slate-300 hover:bg-slate-800"
              >
                <ChevronLeft className="size-4" />
                Close
              </Button>
              <Button
                onClick={complete ? registerFace : captureSample}
                disabled={capturing || registering || !modelsReady}
                className={`h-12 flex-1 rounded-xl text-white shadow-lg ${
                  complete
                    ? "bg-emerald-600 shadow-emerald-950/30 hover:bg-emerald-500"
                    : "bg-blue-600 shadow-blue-950/30 hover:bg-blue-500"
                }`}
              >
                {capturing || registering ? (
                  <LoaderCircle className="size-4 animate-spin" />
                ) : complete ? (
                  <ShieldCheck className="size-4" />
                ) : (
                  <ScanFace className="size-4" />
                )}
                {registering
                  ? "Creating profile…"
                  : capturing
                    ? "Checking face…"
                    : complete
                      ? "Register face profile"
                      : `Capture ${samples.length + 1} of ${CAPTURE_STEPS.length}`}
              </Button>
            </>
          )}
        </div>
      </div>

      <aside className="flex flex-col bg-slate-950/35 p-5 sm:p-6">
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-xl bg-blue-500/15 text-blue-400">
            <ScanFace className="size-5" />
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-bold text-white">{employeeName || "Employee"}</p>
            <p className="text-xs text-slate-500">{employeeCode || "Face enrollment"}</p>
          </div>
        </div>

        <div className="mt-7">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-slate-300">Capture progress</span>
            <span className="font-bold text-blue-400">{samples.length}/{CAPTURE_STEPS.length}</span>
          </div>
          <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-slate-800">
            <div
              className="h-full rounded-full bg-blue-500 transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        <div className="mt-6 grid grid-cols-5 gap-2">
          {CAPTURE_STEPS.map((step, index) => {
            const sample = samples[index];
            return (
              <div key={step.title} className="group relative aspect-square overflow-hidden rounded-xl bg-slate-800">
                {sample ? (
                  <>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={sample.image} alt={`Face sample ${index + 1}`} className="h-full w-full object-cover" />
                    <button
                      type="button"
                      onClick={() => removeSample(index)}
                      className="absolute inset-0 flex items-center justify-center bg-slate-950/70 text-white opacity-0 transition group-hover:opacity-100"
                      aria-label={`Remove face sample ${index + 1}`}
                    >
                      <Trash2 className="size-4" />
                    </button>
                  </>
                ) : (
                  <div className="flex h-full items-center justify-center text-xs font-bold text-slate-600">
                    {index + 1}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div className="mt-7 space-y-3">
          <Tip icon={Sparkles} title="Even lighting" copy="Avoid strong backlight or deep shadows." />
          <Tip icon={Images} title="One person only" copy="Keep other faces outside the camera frame." />
          <Tip icon={CheckCircle2} title="Natural appearance" copy="Remove masks and tinted glasses." />
        </div>

        <div className="mt-auto pt-8">
          <div className="flex items-start gap-3 rounded-xl border border-slate-800 bg-slate-900/70 p-3.5">
            <ShieldCheck className="mt-0.5 size-4 shrink-0 text-emerald-400" />
            <p className="text-[11px] leading-5 text-slate-400">
              Samples are converted into a biometric descriptor used only for attendance verification.
            </p>
          </div>
        </div>
      </aside>
    </div>
  );
}

function Tip({
  icon: Icon,
  title,
  copy,
}: {
  icon: typeof Sparkles;
  title: string;
  copy: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-slate-800 text-slate-400">
        <Icon className="size-4" />
      </div>
      <div>
        <p className="text-xs font-semibold text-slate-200">{title}</p>
        <p className="mt-0.5 text-[11px] leading-4 text-slate-500">{copy}</p>
      </div>
    </div>
  );
}
