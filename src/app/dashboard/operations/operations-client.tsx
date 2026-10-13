"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { format } from "date-fns";
import {
  Check,
  Clock,
  MapPin,
  RefreshCw,
  AlertTriangle,
  X,
  ScanFace,
  Copy,
  WifiOff,
  Filter,
  CheckCircle2,
  ChevronRight,
  ShieldCheck,
} from "lucide-react";

export enum AnomalyType {
  MISSING_CHECKOUT = "MISSING_CHECKOUT",
  OUTSIDE_GEOFENCE = "OUTSIDE_GEOFENCE",
  FACE_LOW_CONFIDENCE = "FACE_LOW_CONFIDENCE",
  FACE_NOT_REGISTERED = "FACE_NOT_REGISTERED",
  DUPLICATE_PUNCH = "DUPLICATE_PUNCH",
  OFFLINE_SYNC = "OFFLINE_SYNC",
}

interface Anomaly {
  id: string;
  type: AnomalyType;
  title: string;
  description: string;
  employee: {
    id: string;
    name: string;
    employeeCode: string;
  };
  data: any;
  status: "pending" | "resolved";
}

export function OperationsClient() {
  const [anomalies, setAnomalies] = useState<Anomaly[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"ALL" | "MISSING_CHECKOUT" | "OUTSIDE_GEOFENCE" | "FACE" | "OTHER">("ALL");

  useEffect(() => {
    fetchAnomalies();
  }, []);

  const fetchAnomalies = async () => {
    try {
      const res = await fetch("/api/operations");
      const data = await res.json();
      if (data.anomalies) {
        setAnomalies(data.anomalies);
      }
    } catch (err) {
      toast.error("Failed to load operations queue");
    } finally {
      setLoading(false);
    }
  };

  const resolveAnomaly = async (anomaly: Anomaly, resolutionType: string, reason: string, extraData: any = {}) => {
    if (!reason || !reason.trim()) {
      toast.error("An explicit supervisor reason is required for compliance.");
      return;
    }

    try {
      setProcessingId(anomaly.id);
      
      const payload = {
        resolutionType,
        reason: reason.trim(),
        extraData
      };

      const res = await fetch(`/api/operations/${anomaly.id}/resolve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to resolve anomaly");
      }

      toast.success("Anomaly resolved and audit recorded");
      setAnomalies((prev) => prev.filter((a) => a.id !== anomaly.id));
    } catch (err: any) {
      toast.error(err.message || "Failed to resolve anomaly");
    } finally {
      setProcessingId(null);
    }
  };

  const pending = anomalies.filter(a => a.status === "pending");
  const missingOutCount = pending.filter(a => a.type === AnomalyType.MISSING_CHECKOUT).length;
  const gpsCount = pending.filter(a => a.type === AnomalyType.OUTSIDE_GEOFENCE).length;
  const faceCount = pending.filter(a => a.type === AnomalyType.FACE_LOW_CONFIDENCE || a.type === AnomalyType.FACE_NOT_REGISTERED).length;
  const otherCount = pending.length - missingOutCount - gpsCount - faceCount;

  const filtered = pending.filter((a) => {
    if (activeTab === "ALL") return true;
    if (activeTab === "MISSING_CHECKOUT") return a.type === AnomalyType.MISSING_CHECKOUT;
    if (activeTab === "OUTSIDE_GEOFENCE") return a.type === AnomalyType.OUTSIDE_GEOFENCE;
    if (activeTab === "FACE") return a.type === AnomalyType.FACE_LOW_CONFIDENCE || a.type === AnomalyType.FACE_NOT_REGISTERED;
    return a.type !== AnomalyType.MISSING_CHECKOUT && a.type !== AnomalyType.OUTSIDE_GEOFENCE && a.type !== AnomalyType.FACE_LOW_CONFIDENCE && a.type !== AnomalyType.FACE_NOT_REGISTERED;
  });

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-16 text-center">
        <div className="size-10 rounded-full border-2 border-zinc-700 border-t-blue-500 animate-spin mb-3" />
        <p className="text-sm font-semibold text-zinc-400">Loading operations work queue...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-gradient-to-r from-zinc-900/80 via-zinc-900/40 to-transparent p-6 rounded-3xl border border-zinc-800 backdrop-blur-sm">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-zinc-400 uppercase tracking-widest">
            <span>Daily Operations</span>
            <span>•</span>
            <span className="text-blue-400">Payroll Pre-Verification</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight mt-1">
            Operations Hub
          </h1>
          <p className="text-sm text-zinc-400 mt-1">
            Review and resolve attendance anomalies before processing leave balances and payroll runs.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            onClick={() => { setLoading(true); fetchAnomalies(); }}
            className="h-10 px-4 rounded-xl border-zinc-700 bg-zinc-800/60 hover:bg-zinc-800 text-zinc-200 text-xs font-semibold flex items-center gap-2 cursor-pointer"
          >
            <RefreshCw className="size-3.5" />
            Refresh Queue
          </Button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs font-semibold">
        <button
          onClick={() => setActiveTab("ALL")}
          className={`px-4 py-2 rounded-xl transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === "ALL"
              ? "bg-white text-zinc-950 font-bold shadow-sm"
              : "bg-zinc-900/80 text-zinc-400 hover:bg-zinc-800 hover:text-white border border-zinc-800"
          }`}
        >
          <span>All Items</span>
          <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${
            activeTab === "ALL" ? "bg-zinc-200 text-zinc-950 font-black" : "bg-zinc-800 text-zinc-400"
          }`}>
            {pending.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab("MISSING_CHECKOUT")}
          className={`px-4 py-2 rounded-xl transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === "MISSING_CHECKOUT"
              ? "bg-rose-500 text-white font-bold shadow-lg shadow-rose-500/20"
              : "bg-zinc-900/80 text-zinc-400 hover:bg-zinc-800 hover:text-white border border-zinc-800"
          }`}
        >
          <span className="size-2 rounded-full bg-rose-400" />
          <span>Missing Checkout</span>
          {missingOutCount > 0 && (
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-rose-950/60 text-rose-200 border border-rose-800">
              {missingOutCount}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab("OUTSIDE_GEOFENCE")}
          className={`px-4 py-2 rounded-xl transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === "OUTSIDE_GEOFENCE"
              ? "bg-amber-500 text-zinc-950 font-bold shadow-lg shadow-amber-500/20"
              : "bg-zinc-900/80 text-zinc-400 hover:bg-zinc-800 hover:text-white border border-zinc-800"
          }`}
        >
          <span className="size-2 rounded-full bg-amber-400" />
          <span>GPS Geofence</span>
          {gpsCount > 0 && (
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-amber-950/60 text-amber-200 border border-amber-800">
              {gpsCount}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab("FACE")}
          className={`px-4 py-2 rounded-xl transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === "FACE"
              ? "bg-blue-600 text-white font-bold shadow-lg shadow-blue-600/20"
              : "bg-zinc-900/80 text-zinc-400 hover:bg-zinc-800 hover:text-white border border-zinc-800"
          }`}
        >
          <span className="size-2 rounded-full bg-blue-400" />
          <span>Biometric & PIN</span>
          {faceCount > 0 && (
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-blue-950/60 text-blue-200 border border-blue-800">
              {faceCount}
            </span>
          )}
        </button>
      </div>

      {/* Main Work Queue Card */}
      <div className="rounded-3xl border border-zinc-800 bg-[#0c0c0e] overflow-hidden shadow-xl">
        <div className="divide-y divide-zinc-800/70">
          {filtered.length === 0 ? (
            <div className="py-20 text-center p-6">
              <div className="size-16 rounded-3xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 mx-auto mb-4 shadow-lg shadow-emerald-500/10">
                <CheckCircle2 className="size-8" />
              </div>
              <h3 className="text-lg font-bold text-white tracking-tight">Queue Clear!</h3>
              <p className="text-xs text-zinc-400 max-w-sm mx-auto mt-1.5 leading-relaxed">
                There are no unresolved attendance anomalies in this category. Your records are clean for payroll calculation.
              </p>
            </div>
          ) : (
            filtered.map((anomaly) => (
              <div key={anomaly.id} className="p-5 sm:p-6 hover:bg-zinc-900/30 transition-colors">
                <AnomalyItem 
                  anomaly={anomaly} 
                  isProcessing={processingId === anomaly.id}
                  onResolve={(type, reason, data) => resolveAnomaly(anomaly, type, reason, data)}
                />
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

function AnomalyItem({ anomaly, isProcessing, onResolve }: { anomaly: Anomaly, isProcessing: boolean, onResolve: (type: string, reason: string, data?: any) => void }) {
  const isMissingOut = anomaly.type === AnomalyType.MISSING_CHECKOUT;
  const isGPS = anomaly.type === AnomalyType.OUTSIDE_GEOFENCE;
  const isFace = anomaly.type === AnomalyType.FACE_LOW_CONFIDENCE || anomaly.type === AnomalyType.FACE_NOT_REGISTERED;
  const isDuplicate = anomaly.type === AnomalyType.DUPLICATE_PUNCH;

  const typeConfig = (() => {
    if (isMissingOut) {
      return {
        label: "Missing Checkout",
        icon: AlertTriangle,
        badgeClass: "bg-rose-500/10 text-rose-400 border-rose-500/20",
        indicator: "bg-rose-500",
      };
    }
    if (isGPS) {
      return {
        label: "Outside Geofence",
        icon: MapPin,
        badgeClass: "bg-amber-500/10 text-amber-400 border-amber-500/20",
        indicator: "bg-amber-500",
      };
    }
    if (isFace) {
      return {
        label: "Biometric Flag",
        icon: ScanFace,
        badgeClass: "bg-blue-500/10 text-blue-400 border-blue-500/20",
        indicator: "bg-blue-500",
      };
    }
    return {
      label: anomaly.title || "Anomaly",
      icon: Copy,
      badgeClass: "bg-purple-500/10 text-purple-400 border-purple-500/20",
      indicator: "bg-purple-500",
    };
  })();

  const TypeIcon = typeConfig.icon;
  const checkInTime = anomaly.data?.checkInTime ? format(new Date(anomaly.data.checkInTime), "HH:mm") : "--:--";
  const expectedOut = isMissingOut ? "17:00" : null;

  // Active inline action form state
  const [activeAction, setActiveAction] = useState<"custom_checkout" | "mark_leave" | "adjust" | "reject" | null>(null);
  const [customTime, setCustomTime] = useState(expectedOut || "17:00");
  const [customStatus, setCustomStatus] = useState<"present" | "late" | "absent">("late");
  const [reasonInput, setReasonInput] = useState("");

  const handleInlineSubmit = () => {
    if (!reasonInput.trim()) {
      toast.error("Please provide an explicit supervisor reason.");
      return;
    }

    if (activeAction === "custom_checkout") {
      const datePart = anomaly.data?.checkInTime ? anomaly.data.checkInTime.split('T')[0] : new Date().toISOString().split('T')[0];
      onResolve("suggest_checkout", reasonInput, { checkOutTime: `${datePart}T${customTime}:00Z` });
    } else if (activeAction === "mark_leave") {
      onResolve("mark_leave", reasonInput);
    } else if (activeAction === "adjust") {
      onResolve("adjust", reasonInput, { status: customStatus });
    } else if (activeAction === "reject") {
      onResolve("reject", reasonInput);
    }
    setActiveAction(null);
    setReasonInput("");
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Top Header Row */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div className="flex items-center gap-2.5">
          <span className={`size-2.5 rounded-full ${typeConfig.indicator}`} />
          <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${typeConfig.badgeClass} flex items-center gap-1.5`}>
            <TypeIcon className="size-3" />
            {typeConfig.label}
          </span>
          <span className="text-xs text-zinc-500 font-medium">
            Recorded {anomaly.data?.date ? format(new Date(anomaly.data.date), "MMM d") : "Today"}
          </span>
        </div>

        <div className="flex items-center gap-2 text-xs text-zinc-400">
          <span className="font-mono text-zinc-500">ID: {anomaly.employee?.employeeCode || "—"}</span>
        </div>
      </div>

      {/* Employee & Details Block */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div className="space-y-1.5">
          <div className="flex items-center gap-3">
            <div className="size-8 rounded-full bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-white text-xs font-bold shrink-0">
              {anomaly.employee?.name?.charAt(0).toUpperCase() || "E"}
            </div>
            <div>
              <h3 className="text-base font-extrabold text-white tracking-tight">
                {anomaly.employee?.name || "Unknown Employee"}
              </h3>
              <div className="flex items-center gap-4 text-xs text-zinc-400 mt-0.5">
                <span className="flex items-center gap-1 text-zinc-400">
                  <MapPin className="size-3.5 text-zinc-500" />
                  {anomaly.data?.siteName || "Headquarters"}
                </span>
                <span className="flex items-center gap-1 text-zinc-400">
                  <Clock className="size-3.5 text-zinc-500" />
                  IN {checkInTime}
                </span>
              </div>
            </div>
          </div>

          <p className="text-xs text-zinc-400 leading-relaxed pt-1">
            {anomaly.description || (isGPS ? "GPS coordinates registered outside approved geofence perimeter" : "Anomaly requiring supervisor resolution.")}
          </p>
        </div>
      </div>

      {/* Inline reason expansion for high-impact actions */}
      {activeAction && (
        <div className="p-4.5 rounded-2xl bg-zinc-950/90 border border-zinc-800 space-y-3.5 mt-1 animate-in fade-in duration-150">
          <div className="flex items-center justify-between text-xs font-bold text-zinc-300">
            <span className="flex items-center gap-1.5 text-amber-400">
              <AlertTriangle className="size-3.5" />
              Supervisor Action: {
                activeAction === "custom_checkout" ? "Custom Checkout Time" : 
                activeAction === "mark_leave" ? "Convert to Leave" : 
                activeAction === "adjust" ? "Adjust Attendance Status" : 
                "Reject Punch Record"
              }
            </span>
            <button onClick={() => { setActiveAction(null); setReasonInput(""); }} className="text-zinc-500 hover:text-zinc-300 p-1">
              <X className="size-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {activeAction === "custom_checkout" && (
              <div>
                <label className="text-[11px] text-zinc-400 block mb-1.5 font-semibold">Checkout Time (HH:MM)</label>
                <input 
                  type="time" 
                  value={customTime}
                  onChange={(e) => setCustomTime(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                />
              </div>
            )}

            {activeAction === "adjust" && (
              <div>
                <label className="text-[11px] text-zinc-400 block mb-1.5 font-semibold">New Status</label>
                <select 
                  value={customStatus}
                  onChange={(e) => setCustomStatus(e.target.value as any)}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                >
                  <option value="present">Present</option>
                  <option value="late">Late</option>
                  <option value="absent">Absent</option>
                </select>
              </div>
            )}

            <div className={activeAction === "reject" || activeAction === "mark_leave" ? "sm:col-span-2" : ""}>
              <label className="text-[11px] text-zinc-400 block mb-1.5 font-semibold">Reason for Override (Required for Audit)</label>
              <input 
                type="text" 
                placeholder="e.g. Approved manual signout following offsite client duty"
                value={reasonInput}
                onChange={(e) => setReasonInput(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-blue-500"
                autoFocus
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-1">
            <Button 
              size="sm" 
              variant="ghost" 
              onClick={() => { setActiveAction(null); setReasonInput(""); }}
              className="text-zinc-400 hover:text-white h-8 text-xs px-3 rounded-lg"
            >
              Cancel
            </Button>
            <Button 
              size="sm" 
              onClick={handleInlineSubmit}
              disabled={isProcessing || !reasonInput.trim()}
              className="bg-blue-600 hover:bg-blue-500 text-white font-bold h-8 text-xs px-4 rounded-lg shadow-sm"
            >
              Confirm Override
            </Button>
          </div>
        </div>
      )}

      {/* Action Button Row */}
      {!activeAction && (
        <div className="flex flex-wrap items-center gap-2 pt-1">
          {isMissingOut ? (
            <>
              <Button 
                size="sm" 
                disabled={isProcessing}
                className="bg-blue-600 hover:bg-blue-500 text-white font-bold h-8 text-xs px-4 rounded-xl shadow-sm"
                onClick={() => {
                  const datePart = anomaly.data?.checkInTime ? anomaly.data.checkInTime.split('T')[0] : new Date().toISOString().split('T')[0];
                  onResolve("suggest_checkout", "Applied standard scheduled shift checkout time", { checkOutTime: `${datePart}T${expectedOut}:00Z` });
                }}
              >
                Signout {expectedOut}
              </Button>
              <Button 
                size="sm" 
                variant="outline" 
                disabled={isProcessing}
                className="border-zinc-700 hover:bg-zinc-800 text-zinc-300 font-semibold h-8 text-xs px-3.5 rounded-xl bg-transparent"
                onClick={() => setActiveAction("custom_checkout")}
              >
                Custom Time
              </Button>
              <Button 
                size="sm" 
                variant="outline" 
                disabled={isProcessing}
                className="border-zinc-700 hover:bg-zinc-800 text-zinc-300 font-semibold h-8 text-xs px-3.5 rounded-xl bg-transparent"
                onClick={() => setActiveAction("mark_leave")}
              >
                Mark Leave
              </Button>
              <Button 
                size="sm" 
                variant="ghost" 
                disabled={isProcessing}
                className="hover:bg-zinc-800 text-zinc-500 hover:text-zinc-300 font-medium h-8 text-xs px-3 rounded-xl"
                onClick={() => onResolve("dismiss", "Dismissed anomaly after review")}
              >
                Dismiss
              </Button>
            </>
          ) : isGPS ? (
            <>
              <Button 
                size="sm" 
                disabled={isProcessing}
                className="bg-blue-600 hover:bg-blue-500 text-white font-bold h-8 text-xs px-4 rounded-xl shadow-sm"
                onClick={() => onResolve("accept", "Supervisor verified punch location was on official duty")}
              >
                Accept Punch
              </Button>
              <Button 
                size="sm" 
                variant="outline" 
                disabled={isProcessing}
                className="border-zinc-700 hover:bg-zinc-800 text-zinc-300 font-semibold h-8 text-xs px-3.5 rounded-xl bg-transparent"
                onClick={() => setActiveAction("adjust")}
              >
                Adjust Status
              </Button>
              <Button 
                size="sm" 
                variant="outline" 
                disabled={isProcessing}
                className="border-zinc-700 hover:bg-red-950/60 text-rose-400 hover:text-rose-300 font-semibold h-8 text-xs px-3.5 rounded-xl bg-transparent"
                onClick={() => setActiveAction("reject")}
              >
                Reject
              </Button>
            </>
          ) : (
            <>
              <Button 
                size="sm" 
                disabled={isProcessing}
                className="bg-blue-600 hover:bg-blue-500 text-white font-bold h-8 text-xs px-4 rounded-xl shadow-sm"
                onClick={() => onResolve("accept", "Supervisor verified and accepted anomaly")}
              >
                Accept & Review
              </Button>
              <Button 
                size="sm" 
                variant="ghost" 
                disabled={isProcessing}
                className="hover:bg-zinc-800 text-zinc-500 hover:text-zinc-300 font-medium h-8 text-xs px-3 rounded-xl"
                onClick={() => onResolve("dismiss", "Dismissed after supervisor verification")}
              >
                Dismiss
              </Button>
            </>
          )}
          {isProcessing && <RefreshCw className="size-4 animate-spin text-zinc-500 ml-2" />}
        </div>
      )}
    </div>
  );
}
