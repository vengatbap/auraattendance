"use client";

import { useState, useEffect } from "react";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

// Match AnomalyType enum from backend
export enum AnomalyType {
  MISSING_CHECKOUT = "MISSING_CHECKOUT",
  OUTSIDE_GEOFENCE = "OUTSIDE_GEOFENCE",
  FACE_LOW_CONFIDENCE = "FACE_LOW_CONFIDENCE",
  DUPLICATE_PUNCH = "DUPLICATE_PUNCH",
  OFFLINE_SYNC = "OFFLINE_SYNC",
  FACE_NOT_REGISTERED = "FACE_NOT_REGISTERED",
}

export function OperationsClient() {
  const [anomalies, setAnomalies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("ALL");
  const [selectedAnomaly, setSelectedAnomaly] = useState<any | null>(null);
  
  // Resolution Modal State
  const [reason, setReason] = useState("");
  const [resolutionType, setResolutionType] = useState<string>("");
  const [checkoutTime, setCheckoutTime] = useState("");
  const [statusOverride, setStatusOverride] = useState("present");
  const [isResolving, setIsResolving] = useState(false);

  const fetchAnomalies = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/operations");
      const data = await res.json();
      if (data.success) {
        setAnomalies(data.data || []);
      } else {
        toast.error("Failed to load anomalies");
      }
    } catch (err) {
      toast.error("An error occurred fetching operations data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnomalies();
  }, []);

  const handleResolveSubmit = async () => {
    if (!reason.trim()) {
      toast.error("Reason is required");
      return;
    }
    if (selectedAnomaly.type === AnomalyType.MISSING_CHECKOUT && resolutionType === "suggest_checkout" && !checkoutTime) {
      toast.error("Checkout time is required");
      return;
    }

    try {
      setIsResolving(true);
      
      const payload: any = {
        resolutionType,
        reason,
        extraData: {}
      };

      if (selectedAnomaly.type === AnomalyType.MISSING_CHECKOUT && resolutionType === "suggest_checkout") {
        const checkInDate = new Date(selectedAnomaly.data.checkInTime).toISOString().split("T")[0];
        // Combine date and time
        payload.extraData.checkOutTime = new Date(`${checkInDate}T${checkoutTime}`).toISOString();
      }

      if (selectedAnomaly.type === AnomalyType.OUTSIDE_GEOFENCE && resolutionType === "adjust") {
        payload.extraData.status = statusOverride;
      }

      const res = await fetch(`/api/operations/${selectedAnomaly.id}/resolve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (data.success) {
        toast.success("Issue resolved");
        setSelectedAnomaly(null);
        setReason("");
        setCheckoutTime("");
        setResolutionType("");
        await fetchAnomalies();
      } else {
        toast.error(data.message || "Failed to resolve");
      }
    } catch (err) {
      toast.error("An error occurred during resolution");
    } finally {
      setIsResolving(false);
    }
  };

  const filteredAnomalies = filter === "ALL" 
    ? anomalies 
    : anomalies.filter(a => a.type === filter);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Operations</h2>
          <p className="text-slate-400">Resolve attendance issues that need attention</p>
        </div>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-2 custom-scrollbar">
        <Button 
          variant={filter === "ALL" ? "default" : "secondary"} 
          onClick={() => setFilter("ALL")}
          size="sm"
        >
          All
        </Button>
        <Button 
          variant={filter === AnomalyType.MISSING_CHECKOUT ? "default" : "secondary"} 
          onClick={() => setFilter(AnomalyType.MISSING_CHECKOUT)}
          size="sm"
        >
          Missing Checkout
        </Button>
        <Button 
          variant={filter === AnomalyType.OUTSIDE_GEOFENCE ? "default" : "secondary"} 
          onClick={() => setFilter(AnomalyType.OUTSIDE_GEOFENCE)}
          size="sm"
        >
          Geofence
        </Button>
        <Button 
          variant={filter === AnomalyType.FACE_LOW_CONFIDENCE ? "default" : "secondary"} 
          onClick={() => setFilter(AnomalyType.FACE_LOW_CONFIDENCE)}
          size="sm"
        >
          Face
        </Button>
        <Button 
          variant={filter === AnomalyType.OFFLINE_SYNC ? "default" : "secondary"} 
          onClick={() => setFilter(AnomalyType.OFFLINE_SYNC)}
          size="sm"
        >
          Offline
        </Button>
        <Button 
          variant={filter === AnomalyType.FACE_NOT_REGISTERED ? "default" : "secondary"} 
          onClick={() => setFilter(AnomalyType.FACE_NOT_REGISTERED)}
          size="sm"
        >
          Registration
        </Button>
      </div>

      <div className="h-px w-full bg-slate-800 my-4" />

      {loading ? (
        <div className="flex justify-center p-8 text-slate-400">Loading anomalies...</div>
      ) : filteredAnomalies.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-12 text-center border border-slate-800 rounded-lg bg-slate-900/20">
          <div className="h-12 w-12 rounded-full bg-slate-800 flex items-center justify-center mb-4">
            <span className="text-2xl">🎉</span>
          </div>
          <h3 className="text-lg font-medium">All caught up!</h3>
          <p className="text-slate-400 max-w-sm mt-1">There are no attendance anomalies requiring your attention right now.</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {filteredAnomalies.map((anomaly) => (
            <Card key={anomaly.id} className="bg-slate-900/50 border-slate-800">
              <CardContent className="p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    {anomaly.type === AnomalyType.MISSING_CHECKOUT && <span className="text-red-500">🔴</span>}
                    {anomaly.type === AnomalyType.OUTSIDE_GEOFENCE && <span className="text-orange-500">🟠</span>}
                    {(anomaly.type === AnomalyType.FACE_LOW_CONFIDENCE || anomaly.type === AnomalyType.FACE_NOT_REGISTERED) && <span className="text-yellow-500">🟡</span>}
                    {anomaly.type === AnomalyType.OFFLINE_SYNC && <span className="text-blue-500">🔵</span>}
                    {anomaly.type === AnomalyType.DUPLICATE_PUNCH && <span className="text-purple-500">🟣</span>}
                    <h3 className="font-semibold text-slate-100">{anomaly.title}</h3>
                  </div>
                  
                  <div className="text-sm font-medium text-slate-200 mt-2">
                    {anomaly.employee?.name || 'Unknown Employee'} 
                    {anomaly.employee?.employeeCode && <span className="text-slate-500 ml-2">({anomaly.employee.employeeCode})</span>}
                  </div>
                  
                  <p className="text-sm text-slate-400 mt-1">
                    {anomaly.description}
                  </p>
                  
                  {anomaly.data?.checkInTime && anomaly.type !== AnomalyType.FACE_NOT_REGISTERED && (
                    <p className="text-xs text-slate-500 mt-1">
                      Check-in: {new Date(anomaly.data.checkInTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} 
                      {anomaly.data?.date && ` on ${new Date(anomaly.data.date).toLocaleDateString()}`}
                    </p>
                  )}
                </div>
                
                <Button 
                  onClick={() => {
                    setSelectedAnomaly(anomaly);
                    setReason("");
                    setResolutionType("");
                    // Default resolutions
                    if (anomaly.type === AnomalyType.MISSING_CHECKOUT) setResolutionType("suggest_checkout");
                    else if (anomaly.type === AnomalyType.OUTSIDE_GEOFENCE) setResolutionType("review");
                    else if (anomaly.type === AnomalyType.FACE_LOW_CONFIDENCE) setResolutionType("review");
                    else if (anomaly.type === AnomalyType.FACE_NOT_REGISTERED) setResolutionType("review");
                    else if (anomaly.type === AnomalyType.OFFLINE_SYNC) setResolutionType("accept");
                    else if (anomaly.type === AnomalyType.DUPLICATE_PUNCH) setResolutionType("keep_original");
                    else setResolutionType("review");
                  }}
                  variant="outline"
                  className="shrink-0"
                >
                  {anomaly.type === AnomalyType.MISSING_CHECKOUT ? "Resolve" : "Review"}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Resolution Dialog */}
      <Dialog open={!!selectedAnomaly} onOpenChange={(open) => !open && setSelectedAnomaly(null)}>
        <DialogContent className="sm:max-w-[425px] bg-slate-900 border-slate-800 text-slate-100">
          <DialogHeader>
            <DialogTitle>Resolve Issue</DialogTitle>
            <DialogDescription className="text-slate-400">
              {selectedAnomaly?.title} for {selectedAnomaly?.employee?.name}
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label>Action</Label>
              <Select value={resolutionType} onValueChange={(v) => setResolutionType(v as string)}>
                <SelectTrigger className="border-slate-800 bg-slate-950/50">
                  <SelectValue placeholder="Select action" />
                </SelectTrigger>
                <SelectContent className="border-slate-800 bg-slate-900">
                  {selectedAnomaly?.type === AnomalyType.MISSING_CHECKOUT && (
                    <SelectItem value="suggest_checkout">Suggest Checkout</SelectItem>
                  )}
                  {selectedAnomaly?.type === AnomalyType.OUTSIDE_GEOFENCE && (
                    <>
                      <SelectItem value="accept">Accept Punch</SelectItem>
                      <SelectItem value="adjust">Adjust Status</SelectItem>
                      <SelectItem value="review">Mark as Reviewed</SelectItem>
                    </>
                  )}
                  {selectedAnomaly?.type === AnomalyType.FACE_NOT_REGISTERED && (
                    <>
                      <SelectItem value="review">Mark as Reviewed</SelectItem>
                    </>
                  )}
                  {(selectedAnomaly?.type === AnomalyType.FACE_LOW_CONFIDENCE || selectedAnomaly?.type === AnomalyType.DUPLICATE_PUNCH || selectedAnomaly?.type === AnomalyType.OFFLINE_SYNC) && (
                    <>
                      <SelectItem value="accept">Accept</SelectItem>
                      <SelectItem value="keep_original">Keep Original</SelectItem>
                      <SelectItem value="review">Mark as Reviewed</SelectItem>
                    </>
                  )}
                </SelectContent>
              </Select>
            </div>

            {selectedAnomaly?.type === AnomalyType.MISSING_CHECKOUT && resolutionType === "suggest_checkout" && (
              <div className="space-y-2">
                <Label>Checkout Time</Label>
                <Input 
                  type="time" 
                  value={checkoutTime} 
                  onChange={(e) => setCheckoutTime(e.target.value)} 
                  className="border-slate-800 bg-slate-950/50 text-slate-100"
                />
              </div>
            )}

            {selectedAnomaly?.type === AnomalyType.OUTSIDE_GEOFENCE && resolutionType === "adjust" && (
              <div className="space-y-2">
                <Label>Adjust Attendance Status</Label>
                <Select value={statusOverride} onValueChange={(v) => setStatusOverride(v as string)}>
                  <SelectTrigger className="border-slate-800 bg-slate-950/50">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent className="border-slate-800 bg-slate-900">
                    <SelectItem value="present">Present</SelectItem>
                    <SelectItem value="late">Late</SelectItem>
                    <SelectItem value="absent">Absent</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="space-y-2">
              <Label>Reason (Required for Audit Log)</Label>
              <Textarea 
                placeholder="Explain why this action was taken..."
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="border-slate-800 bg-slate-950/50 text-slate-100 placeholder:text-slate-600"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedAnomaly(null)} disabled={isResolving}>
              Cancel
            </Button>
            <Button onClick={handleResolveSubmit} disabled={isResolving} className="bg-blue-600 hover:bg-blue-700">
              {isResolving ? "Resolving..." : "Confirm Resolution"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
