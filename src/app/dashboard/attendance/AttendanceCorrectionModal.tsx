"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

interface AttendanceCorrectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  logId: string;
  onSuccess: () => void;
  employeeName: string;
}

export function AttendanceCorrectionModal({ isOpen, onClose, logId, onSuccess, employeeName }: AttendanceCorrectionModalProps) {
  const [type, setType] = useState("check_in_time");
  const [time, setTime] = useState("");
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!reason.trim()) {
      toast.error("Reason is required");
      return;
    }
    
    // Ensure time has seconds for datetime format if check in/out is selected
    let formattedTime = time;
    if (time && time.length === 16) { // "YYYY-MM-DDTHH:mm"
      formattedTime = `${time}:00.000Z`;
      // Convert local datetime to UTC
      const localDate = new Date(time);
      formattedTime = localDate.toISOString();
    }

    setLoading(true);
    try {
      const payload: any = {
        attendanceLogId: logId,
        type,
        reason,
      };

      if (type === "check_in_time") payload.checkInTime = formattedTime;
      if (type === "check_out_time") payload.checkOutTime = formattedTime;

      const res = await fetch("/api/attendance/adjust", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || "Failed to adjust attendance");
      }

      toast.success(data.message || "Attendance adjusted successfully");
      onSuccess();
      onClose();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md bg-slate-900 border-slate-800 text-slate-100">
        <DialogHeader>
          <DialogTitle>Correct Attendance</DialogTitle>
          <DialogDescription className="text-slate-400">
            Adjust attendance record for {employeeName}. This will be logged for compliance.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={onSubmit} className="space-y-4 py-4">
          <div className="space-y-2">
            <Label className="text-slate-300">Adjustment Type</Label>
            <Select value={type} onValueChange={(v) => setType(v as string)}>
              <SelectTrigger className="border-slate-800 bg-slate-950/50">
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent className="border-slate-800 bg-slate-900 text-slate-100">
                <SelectItem value="check_in_time">Update Check-in Time</SelectItem>
                <SelectItem value="check_out_time">Update Check-out Time</SelectItem>
                <SelectItem value="mark_present">Mark as Present</SelectItem>
                <SelectItem value="mark_absent">Mark as Absent</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {(type === "check_in_time" || type === "check_out_time") && (
            <div className="space-y-2">
              <Label className="text-slate-300">Time</Label>
              <Input
                type="datetime-local"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                required
                className="border-slate-800 bg-slate-950/50 text-slate-100 dark:[color-scheme:dark]"
              />
            </div>
          )}

          <div className="space-y-2">
            <Label className="text-slate-300">Reason</Label>
            <Input
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. Forgot to punch out"
              required
              className="border-slate-800 bg-slate-950/50 text-slate-100"
            />
          </div>

          <DialogFooter className="pt-4 border-none bg-transparent">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={loading}
              className="border-slate-700 text-slate-300 hover:bg-slate-800"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="bg-blue-600 text-white hover:bg-blue-700"
            >
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Changes
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
