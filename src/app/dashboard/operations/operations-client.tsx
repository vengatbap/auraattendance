"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { format } from "date-fns";
import { Check, X, Clock, MapPin, AlertCircle, RefreshCw, Layers } from "lucide-react";

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
      toast.error("Failed to load operations");
    } finally {
      setLoading(false);
    }
  };

  const resolveAnomaly = async (anomaly: Anomaly, resolutionType: string, reason: string, extraData: any = {}) => {
    try {
      setProcessingId(anomaly.id);
      
      const payload = {
        resolutionType,
        reason,
        extraData
      };

      const res = await fetch(`/api/operations/${anomaly.id}/resolve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to resolve");
      }

      toast.success("Resolved successfully");
      setAnomalies((prev) => prev.filter((a) => a.id !== anomaly.id));
    } catch (err: any) {
      toast.error(err.message || "Failed to resolve");
    } finally {
      setProcessingId(null);
    }
  };

  const pending = anomalies.filter(a => a.status === "pending");
  const missingOut = pending.filter(a => a.type === AnomalyType.MISSING_CHECKOUT).length;
  const gpsCount = pending.filter(a => a.type === AnomalyType.OUTSIDE_GEOFENCE).length;
  const faceCount = pending.filter(a => a.type === AnomalyType.FACE_LOW_CONFIDENCE || a.type === AnomalyType.FACE_NOT_REGISTERED).length;
  const otherCount = pending.length - missingOut - gpsCount - faceCount;

  if (loading) {
    return <div className="p-8 text-center text-zinc-500 animate-pulse">Loading operations...</div>;
  }

  return (
    <div className="w-full max-w-4xl mx-auto rounded-2xl border border-zinc-800 bg-[#0a0a0c] overflow-hidden shadow-2xl">
      {/* Header */}
      <div className="flex justify-between items-center px-6 py-5 border-b border-zinc-800 bg-[#0e0e11]">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight">Operations</h1>
          <p className="text-sm text-zinc-400 mt-1">Resolve attendance issues before payroll</p>
        </div>
        <div className="text-right">
          <p className="text-sm font-semibold text-zinc-300">Today, {format(new Date(), "MMM d")}</p>
        </div>
      </div>

      {/* Summary Bar */}
      <div className="flex gap-6 p-4 border-b border-zinc-800 bg-zinc-900/40 text-[13px] font-semibold px-6">
        <span className="text-white">{pending.length} Needs Review</span>
        <span className={missingOut > 0 ? "text-rose-400" : "text-zinc-600"}>{missingOut} Missing Out</span>
        <span className={gpsCount > 0 ? "text-amber-400" : "text-zinc-600"}>{gpsCount} GPS</span>
        <span className={faceCount > 0 ? "text-blue-400" : "text-zinc-600"}>{faceCount} Face</span>
        <span className={otherCount > 0 ? "text-zinc-400" : "text-zinc-600"}>{otherCount} Other</span>
      </div>

      {/* List */}
      <div className="divide-y divide-zinc-800/60">
        {pending.length === 0 ? (
          <div className="py-16 text-center">
            <div className="inline-flex size-16 rounded-full bg-emerald-500/10 items-center justify-center mb-4">
              <Check className="size-8 text-emerald-500" />
            </div>
            <h3 className="text-lg font-bold text-white">All caught up!</h3>
            <p className="text-sm text-zinc-500 mt-1">There are no anomalies requiring review.</p>
          </div>
        ) : (
          pending.map((anomaly) => (
            <div key={anomaly.id} className="p-6 hover:bg-zinc-900/30 transition-colors">
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
  );
}

function AnomalyItem({ anomaly, isProcessing, onResolve }: { anomaly: Anomaly, isProcessing: boolean, onResolve: (type: string, reason: string, data?: any) => void }) {
  const isMissingOut = anomaly.type === AnomalyType.MISSING_CHECKOUT;
  const isGPS = anomaly.type === AnomalyType.OUTSIDE_GEOFENCE;
  
  const icon = isMissingOut ? "🔴" : isGPS ? "🟠" : "🟡";
  const title = isMissingOut ? "Missing Checkout" : isGPS ? "Outside Geofence" : anomaly.title;

  const checkInTime = anomaly.data?.checkInTime ? format(new Date(anomaly.data.checkInTime), "HH:mm") : "--:--";

  // Simulate expected checkout time based on shift logic (if missing out)
  const expectedOut = isMissingOut ? "17:00" : null;

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h3 className="text-[15px] font-bold text-zinc-100 flex items-center gap-2">
          <span>{icon}</span> {title}
        </h3>
        
        <div className="mt-3 flex items-center gap-6 text-[13px]">
          <span className="font-bold text-white uppercase tracking-wide">
            {anomaly.employee?.name || 'Unknown'}
          </span>
          <span className="text-zinc-500 flex items-center gap-1.5">
            <MapPin className="size-3.5" />
            {anomaly.data?.siteName || "Headquarters"}
          </span>
          <span className="text-zinc-500 flex items-center gap-1.5">
            <Clock className="size-3.5" />
            IN {checkInTime}
          </span>
        </div>

        {isMissingOut && expectedOut && (
          <p className="mt-2 text-[13px] font-medium text-zinc-400">
            Expected checkout: {expectedOut}
          </p>
        )}

        {isGPS && (
          <p className="mt-2 text-[13px] font-medium text-zinc-400">
            {anomaly.description || "184m outside allowed radius"}
          </p>
        )}
        
        {!isMissingOut && !isGPS && (
          <p className="mt-2 text-[13px] font-medium text-zinc-400">
            {anomaly.description}
          </p>
        )}
      </div>

      <div className="flex flex-wrap gap-2 mt-1">
        {isMissingOut ? (
          <>
            <Button 
              size="sm" 
              disabled={isProcessing}
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold h-8 text-xs px-4"
              onClick={() => {
                const datePart = anomaly.data.checkInTime ? anomaly.data.checkInTime.split('T')[0] : new Date().toISOString().split('T')[0];
                onResolve("suggest_checkout", "Applied suggested shift checkout", { checkOutTime: `${datePart}T${expectedOut}:00Z` });
              }}
            >
              Checkout {expectedOut}
            </Button>
            <Button 
              size="sm" 
              variant="outline" 
              disabled={isProcessing}
              className="border-zinc-700 hover:bg-zinc-800 text-zinc-300 font-bold h-8 text-xs px-4 bg-transparent"
              onClick={() => onResolve("suggest_checkout", "Manual checkout override", { checkOutTime: new Date().toISOString() })}
            >
              Checkout Now
            </Button>
            <Button 
              size="sm" 
              variant="outline" 
              disabled={isProcessing}
              className="border-zinc-700 hover:bg-zinc-800 text-zinc-300 font-bold h-8 text-xs px-4 bg-transparent"
              onClick={() => onResolve("mark_leave", "Marked as half-day leave")}
            >
              Mark Leave
            </Button>
            <Button 
              size="sm" 
              variant="ghost" 
              disabled={isProcessing}
              className="hover:bg-zinc-800 text-zinc-500 hover:text-zinc-300 font-bold h-8 text-xs px-4"
              onClick={() => onResolve("dismiss", "Dismissed anomaly")}
            >
              Dismiss
            </Button>
          </>
        ) : isGPS ? (
          <>
            <Button 
              size="sm" 
              disabled={isProcessing}
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold h-8 text-xs px-4"
              onClick={() => onResolve("accept", "Accepted out of bounds punch")}
            >
              Accept
            </Button>
            <Button 
              size="sm" 
              variant="outline" 
              disabled={isProcessing}
              className="border-zinc-700 hover:bg-zinc-800 text-zinc-300 font-bold h-8 text-xs px-4 bg-transparent"
              onClick={() => onResolve("adjust", "Adjusted attendance status to late", { status: "late" })}
            >
              Adjust
            </Button>
            <Button 
              size="sm" 
              variant="outline" 
              disabled={isProcessing}
              className="border-zinc-700 hover:bg-red-950 text-rose-400 hover:text-rose-300 font-bold h-8 text-xs px-4 bg-transparent"
              onClick={() => onResolve("reject", "Rejected out of bounds punch")}
            >
              Reject
            </Button>
          </>
        ) : (
          <>
             <Button 
              size="sm" 
              disabled={isProcessing}
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold h-8 text-xs px-4"
              onClick={() => onResolve("accept", "Accepted anomaly")}
            >
              Accept / Review
            </Button>
            <Button 
              size="sm" 
              variant="ghost" 
              disabled={isProcessing}
              className="hover:bg-zinc-800 text-zinc-500 hover:text-zinc-300 font-bold h-8 text-xs px-4"
              onClick={() => onResolve("dismiss", "Dismissed")}
            >
              Dismiss
            </Button>
          </>
        )}
        {isProcessing && <RefreshCw className="size-4 animate-spin text-zinc-500 ml-2 self-center" />}
      </div>
    </div>
  );
}
