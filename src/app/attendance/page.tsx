"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
	ArrowRight,
	Building2,
	Camera,
	Check,
	CheckCircle2,
	Clock3,
	LoaderCircle,
	LocateFixed,
	LockKeyhole,
	MapPin,
	RefreshCw,
	ScanFace,
	ShieldCheck,
	TriangleAlert,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { haversineDistance } from "@/utils";

interface Site {
	id: string;
	name: string;
	latitude: number;
	longitude: number;
	radius: number;
	status: string;
}

interface LocationReading {
	latitude: number;
	longitude: number;
	accuracy: number;
}

interface PunchResult {
	action: "check_in" | "check_out" | "already_checked_out";
	employee: { name: string; employeeNumber: string };
	site: { name: string };
	faceScore: number;
	distanceMeters: number | null;
	locationMatched: boolean;
	latitude: number;
	longitude: number;
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

export default function AttendancePunchPage() {
	const videoRef = useRef<HTMLVideoElement>(null);
	const canvasRef = useRef<HTMLCanvasElement>(null);
	const streamRef = useRef<MediaStream | null>(null);
	const [sites, setSites] = useState<Site[]>([]);
	const [location, setLocation] = useState<LocationReading | null>(null);
	const [locationBusy, setLocationBusy] = useState(true);
	const [streaming, setStreaming] = useState(false);
	const [busy, setBusy] = useState(false);
	const [error, setError] = useState("");
	const [result, setResult] = useState<PunchResult | null>(null);
	const [now, setNow] = useState(() => new Date());

	const stopCamera = useCallback(() => {
		streamRef.current?.getTracks().forEach((track) => track.stop());
		streamRef.current = null;
		if (videoRef.current) videoRef.current.srcObject = null;
		setStreaming(false);
	}, []);

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

	useEffect(() => {
		async function initialize() {
			try {
				const response = await fetch("/api/sites");
				if (!response.ok) throw new Error();
				const data = (await response.json()) as Site[];
				setSites(data.filter((site) => site.status === "active"));
			} catch {
				setError("Unable to load attendance sites.");
			}
		}

		void initialize();
		void requestLocation();
		const clock = window.setInterval(() => setNow(new Date()), 1000);
		return () => {
			window.clearInterval(clock);
			streamRef.current?.getTracks().forEach((track) => track.stop());
		};
	}, [requestLocation]);

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

	async function startCamera() {
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
			setError("Camera access is required to verify your identity.");
		}
	}

	function capturePhoto() {
		const video = videoRef.current;
		const canvas = canvasRef.current;
		if (!video || !canvas || !video.videoWidth) return null;
		canvas.width = video.videoWidth;
		canvas.height = video.videoHeight;
		const context = canvas.getContext("2d");
		if (!context) return null;
		context.drawImage(video, 0, 0, canvas.width, canvas.height);
		return canvas.toDataURL("image/jpeg", 0.86);
	}

	async function generateDescriptor(photo: string) {
		const faceapi = await loadFaceModels();
		const image = new Image();
		image.src = photo;
		await image.decode();
		const detection = await faceapi
			.detectSingleFace(image)
			.withFaceLandmarks()
			.withFaceDescriptor();
		if (!detection) throw new Error("No face detected. Center your face and try again.");
		return Array.from(detection.descriptor);
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

	async function submitPunch() {
		setBusy(true);
		setError("");
		setResult(null);
		try {
			const photo = capturePhoto();
			if (!photo) throw new Error("The camera is not ready yet.");

			const [position, descriptor] = await Promise.all([
				getFreshLocation(),
				generateDescriptor(photo),
			]);
			setLocation({
				latitude: position.coords.latitude,
				longitude: position.coords.longitude,
				accuracy: position.coords.accuracy,
			});

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
				}),
			});
			const data = await response.json();
			if (!response.ok) throw new Error(data.error || "Attendance was not saved.");
			setResult(data);
			stopCamera();
		} catch (caught) {
			setError(caught instanceof Error ? caught.message : "Attendance failed.");
		} finally {
			setBusy(false);
		}
	}

	function reset() {
		stopCamera();
		setResult(null);
		setError("");
		void requestLocation();
	}

	const actionLabel =
		result?.action === "check_in"
			? "Check-in complete"
			: result?.action === "check_out"
				? "Check-out complete"
				: "Attendance already complete";

	return (
		<main className="relative min-h-screen overflow-hidden bg-[#f4f7fb] text-slate-950">
			<div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_15%_15%,rgba(37,99,235,0.10),transparent_32%),radial-gradient(circle_at_85%_75%,rgba(14,165,233,0.08),transparent_30%)]" />
			<div className="relative mx-auto flex min-h-screen w-full max-w-7xl flex-col px-4 py-5 sm:px-6 lg:px-8">
				<header className="flex items-center justify-between">
					<div className="flex items-center gap-3">
						<div className="flex size-10 items-center justify-center rounded-xl bg-blue-600 text-white shadow-lg shadow-blue-600/20">
							<ScanFace className="size-5" />
						</div>
						<div>
							<p className="text-sm font-bold tracking-tight">Aura Attendance</p>
							<p className="text-[11px] font-medium text-slate-500">Secure workforce access</p>
						</div>
					</div>
					<Link
						href="/login"
						className="flex items-center gap-2 rounded-full border border-slate-200 bg-white/80 px-4 py-2 text-xs font-semibold text-slate-600 shadow-sm backdrop-blur transition hover:border-slate-300 hover:text-slate-950"
					>
						<LockKeyhole className="size-3.5" />
						Admin portal
					</Link>
				</header>

				<div className="grid flex-1 items-center gap-8 py-8 lg:grid-cols-[0.9fr_1.1fr] lg:gap-16">
					<section className="order-2 lg:order-1">
						<div className="mb-5 inline-flex items-center gap-2 rounded-full border border-blue-100 bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700">
							<ShieldCheck className="size-3.5" />
							Face + geofence protected
						</div>
						<h1 className="max-w-xl text-4xl font-bold leading-[1.08] tracking-[-0.04em] sm:text-5xl lg:text-6xl">
							Attendance that knows you&apos;re
							<span className="text-blue-600"> in the right place.</span>
						</h1>
						<p className="mt-5 max-w-lg text-base leading-7 text-slate-600">
							Your face confirms who you are. Your live location automatically binds the punch
							to the nearest approved workplace.
						</p>

						<div className="mt-8 grid max-w-lg gap-3 sm:grid-cols-3">
							<Feature icon={ScanFace} title="Face verified" copy="Biometric match" />
							<Feature icon={LocateFixed} title="Auto-bound" copy="No site selection" />
							<Feature icon={ShieldCheck} title="Server checked" copy="Tamper resistant" />
						</div>
					</section>

					<section className="order-1 lg:order-2">
						<div className="mx-auto w-full max-w-xl overflow-hidden rounded-[2rem] border border-white bg-white shadow-[0_24px_80px_-24px_rgba(15,23,42,0.25)]">
							<div className="flex items-center justify-between border-b border-slate-100 px-5 py-4 sm:px-6">
								<div>
									<p className="text-sm font-bold">Mark attendance</p>
									<p className="mt-0.5 text-xs text-slate-500">
										{now.toLocaleDateString(undefined, { weekday: "long", month: "short", day: "numeric" })}
									</p>
								</div>
								<div className="flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1.5 font-mono text-xs font-semibold text-slate-700" suppressHydrationWarning={true} >
									<Clock3 className="size-3.5" />
									{now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
								</div>
							</div>

							<div className="p-4 sm:p-6">
								<canvas ref={canvasRef} className="hidden" />
								<div className="relative aspect-[4/3] overflow-hidden rounded-2xl bg-slate-950">
									<video
										ref={videoRef}
										autoPlay
										muted
										playsInline
										className={`h-full w-full scale-x-[-1] object-cover transition-opacity ${streaming ? "opacity-100" : "opacity-0"}`}
									/>

									{!streaming && !result && (
										<div className="absolute inset-0 flex flex-col items-center justify-center bg-[radial-gradient(circle_at_center,#1e293b_0%,#020617_72%)] text-center">
											<div className="relative mb-5">
												<div className="absolute inset-0 animate-ping rounded-full bg-blue-500/20" />
												<div className="relative flex size-16 items-center justify-center rounded-full border border-blue-400/30 bg-blue-500/15 text-blue-300">
													<Camera className="size-7" />
												</div>
											</div>
											<p className="text-sm font-semibold text-white">Ready for verification</p>
											<p className="mt-1.5 max-w-56 text-xs leading-5 text-slate-400">
												Open the camera and position your face inside the frame.
											</p>
										</div>
									)}

									{streaming && (
										<>
											<div className="pointer-events-none absolute inset-[12%_22%] rounded-[42%] border border-white/60 shadow-[0_0_0_999px_rgba(2,6,23,0.22)]" />
											<div className="absolute left-4 top-4 flex items-center gap-2 rounded-full bg-slate-950/70 px-3 py-1.5 text-[11px] font-semibold text-white backdrop-blur">
												<span className="size-1.5 animate-pulse rounded-full bg-emerald-400" />
												Camera live
											</div>
										</>
									)}

									{result && (
										<div className="absolute inset-0 flex flex-col items-center justify-center bg-emerald-950 px-6 text-center text-white">
											<div className="mb-4 flex size-16 items-center justify-center rounded-full bg-emerald-400 text-emerald-950 shadow-xl shadow-emerald-950/30">
												<Check className="size-8 stroke-[3]" />
											</div>
											<p className="text-xl font-bold">{actionLabel}</p>
											<p className="mt-2 text-sm text-emerald-100">
												{result.employee.name} · {result.site.name}
											</p>
											<p className="mt-4 text-xs text-emerald-200/80">
												Face {(result.faceScore * 100).toFixed(1)}% ·{" "}
												{result.locationMatched && result.distanceMeters != null
													? `${Math.round(result.distanceMeters)}m from site`
													: `GPS ${result.latitude.toFixed(5)}, ${result.longitude.toFixed(5)}`}
											</p>
										</div>
									)}
								</div>

								<div className="mt-4 grid gap-3 sm:grid-cols-2">
									<StatusCard
										active={isInsideGeofence}
										loading={locationBusy}
										title={locationBusy ? "Locating you…" : isInsideGeofence ? "Inside attendance zone" : "Outside attendance zones"}
										detail={nearestSite ? `${nearestSite.name} · ${Math.round(nearestSite.distance)}m away · saves as unknown` : "Will save as unknown location"}
									/>
									<div className="rounded-2xl border border-slate-200 bg-slate-50 p-3.5">
										<div className="flex items-start gap-3">
											<div className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg bg-white text-slate-700 shadow-sm">
												<Building2 className="size-4" />
											</div>
											<div>
												<p className="text-xs font-bold">Automatic site binding</p>
												<p className="mt-1 text-[11px] text-slate-500">
													{location ? `GPS accuracy ±${Math.round(location.accuracy)}m` : "Location permission required"}
												</p>
											</div>
										</div>
									</div>
								</div>

								{error && (
									<div className="mt-4 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-xs text-red-800">
										<TriangleAlert className="mt-0.5 size-4 shrink-0" />
										<span className="leading-5">{error}</span>
									</div>
								)}

								<div className="mt-5 flex gap-3">
									{result ? (
										<Button onClick={reset} className="h-12 w-full rounded-xl bg-slate-950 text-white hover:bg-slate-800">
											<RefreshCw className="size-4" />
											Mark another attendance
										</Button>
									) : !streaming ? (
										<Button onClick={startCamera} className="h-12 w-full rounded-xl bg-blue-600 text-white shadow-lg shadow-blue-600/20 hover:bg-blue-700">
											<Camera className="size-4" />
											Open camera
											<ArrowRight className="ml-auto size-4" />
										</Button>
									) : (
										<>
											<Button
												variant="outline"
												onClick={stopCamera}
												disabled={busy}
												className="h-12 rounded-xl border-slate-200 px-5 text-slate-700"
											>
												Cancel
											</Button>
											<Button
												onClick={submitPunch}
												disabled={busy || locationBusy || !location}
												className="h-12 flex-1 rounded-xl bg-blue-600 text-white shadow-lg shadow-blue-600/20 hover:bg-blue-700"
											>
												{busy ? <LoaderCircle className="size-4 animate-spin" /> : <CheckCircle2 className="size-4" />}
												{busy ? "Verifying…" : "Verify & submit"}
											</Button>
										</>
									)}
								</div>

								{!locationBusy && !location && (
									<button onClick={() => void requestLocation()} className="mt-3 flex w-full items-center justify-center gap-2 text-xs font-semibold text-blue-600 hover:text-blue-700">
										<LocateFixed className="size-3.5" />
										Retry location
									</button>
								)}
							</div>
						</div>
					</section>
				</div>

				<footer className="flex items-center justify-center gap-2 pb-1 text-[11px] text-slate-400">
					<ShieldCheck className="size-3.5" />
					Encrypted verification · Location is used only for attendance
				</footer>
			</div>
		</main>
	);
}

function Feature({
	icon: Icon,
	title,
	copy,
}: {
	icon: typeof ScanFace;
	title: string;
	copy: string;
}) {
	return (
		<div className="rounded-2xl border border-white bg-white/70 p-4 shadow-sm backdrop-blur">
			<Icon className="mb-3 size-5 text-blue-600" />
			<p className="text-xs font-bold">{title}</p>
			<p className="mt-1 text-[11px] text-slate-500">{copy}</p>
		</div>
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
		<div className={`rounded-2xl border p-3.5 ${active ? "border-emerald-200 bg-emerald-50" : "border-amber-200 bg-amber-50"}`}>
			<div className="flex items-start gap-3">
				<div className={`mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg ${active ? "bg-emerald-600 text-white" : "bg-amber-500 text-white"}`}>
					{loading ? <LoaderCircle className="size-4 animate-spin" /> : <MapPin className="size-4" />}
				</div>
				<div className="min-w-0">
					<p className="text-xs font-bold text-slate-900">{title}</p>
					<p className="mt-1 truncate text-[11px] text-slate-600">{detail}</p>
				</div>
			</div>
		</div>
	);
}
