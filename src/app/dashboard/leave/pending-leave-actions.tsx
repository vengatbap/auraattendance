"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

export function PendingLeaveActions({ requestId }: { requestId: string }) {
  const router = useRouter();
  const [isRejectOpen, setIsRejectOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [isApproving, setIsApproving] = useState(false);
  const [isRejecting, setIsRejecting] = useState(false);

  const handleApprove = async () => {
    setIsApproving(true);
    try {
      const res = await fetch(`/api/leave/requests/${requestId}/approve`, {
        method: "POST"
      });
      if (res.ok) {
        toast.success("Leave request approved");
        router.refresh();
      } else {
        const error = await res.json();
        toast.error(error.message || "Failed to approve");
      }
    } catch (e) {
      toast.error("Failed to approve leave request");
    } finally {
      setIsApproving(false);
    }
  };

  const handleReject = async () => {
    if (!reason.trim()) {
      toast.error("Reason is required");
      return;
    }
    setIsRejecting(true);
    try {
      const res = await fetch(`/api/leave/requests/${requestId}/reject`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason })
      });
      if (res.ok) {
        toast.success("Leave request rejected");
        setIsRejectOpen(false);
        setReason("");
        router.refresh();
      } else {
        const error = await res.json();
        toast.error(error.message || "Failed to reject");
      }
    } catch (e) {
      toast.error("Failed to reject leave request");
    } finally {
      setIsRejecting(false);
    }
  };

  return (
    <>
      <div className="flex gap-2 w-full mt-4">
        <Button 
          className="flex-1" 
          variant="default" 
          onClick={handleApprove}
          disabled={isApproving || isRejecting}
        >
          {isApproving ? "Approving..." : "Approve"}
        </Button>
        <Button 
          className="flex-1 bg-zinc-800 text-white hover:bg-zinc-700" 
          variant="outline" 
          onClick={() => setIsRejectOpen(true)}
          disabled={isApproving || isRejecting}
        >
          Reject
        </Button>
      </div>

      <Dialog open={isRejectOpen} onOpenChange={setIsRejectOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Leave Request</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Rejection Reason</Label>
              <Input 
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Enter reason for rejection"
                className="bg-zinc-900 border-zinc-800 text-white"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsRejectOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleReject} disabled={isRejecting}>
              {isRejecting ? "Rejecting..." : "Confirm Reject"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
