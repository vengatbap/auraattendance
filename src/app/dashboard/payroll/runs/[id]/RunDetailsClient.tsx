"use client";

import { useState } from "react";
import { calculateRunAction, approveRunAction, lockRunAction } from "./actions";

export default function RunDetailsClient({ runId, status }: { runId: string, status: string }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const displayStatus = status === "PAID" ? "LOCKED" : status;

  const handleCalculate = async () => {
    setLoading(true);
    setError(null);
    try {
      await calculateRunAction(runId);
    } catch (err: any) {
      setError(err.message || "Failed to calculate run");
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async () => {
    setLoading(true);
    setError(null);
    try {
      await approveRunAction(runId);
    } catch (err: any) {
      setError(err.message || "Failed to approve run");
    } finally {
      setLoading(false);
    }
  };

  const handleLock = async () => {
    setLoading(true);
    setError(null);
    try {
      await lockRunAction(runId);
    } catch (err: any) {
      setError(err.message || "Failed to lock run");
    } finally {
      setLoading(false);
    }
  };

  const steps = ["DRAFT", "REVIEW", "APPROVED", "LOCKED"];
  // If CALCULATING, we show it visually at DRAFT with calculating state
  const normalizedStatus = displayStatus === "CALCULATING" ? "DRAFT" : displayStatus;
  const currentIndex = steps.indexOf(normalizedStatus);

  return (
    <div className="mb-6">
      {error && (
        <div className="bg-red-50 text-red-600 p-3 rounded mb-4">
          {error}
        </div>
      )}

      <div className="flex items-center justify-between bg-white p-4 rounded shadow mb-6">
        <div className="flex space-x-4 w-full">
          {steps.map((step, idx) => {
            const isCompleted = currentIndex >= idx;
            const isCurrent = normalizedStatus === step;
            return (
              <div key={step} className="flex-1 text-center flex flex-col items-center relative">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm z-10 ${
                  isCurrent ? "bg-blue-600 text-white" : isCompleted ? "bg-green-500 text-white" : "bg-gray-200 text-gray-500"
                }`}>
                  {idx + 1}
                </div>
                <div className={`mt-2 text-sm font-medium ${
                  isCurrent ? "text-blue-600" : isCompleted ? "text-green-600" : "text-gray-500"
                }`}>
                  {step}
                </div>
                {idx < steps.length - 1 && (
                  <div className={`absolute top-4 left-1/2 w-full h-1 -z-10 ${
                    currentIndex > idx ? "bg-green-500" : "bg-gray-200"
                  }`}></div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div className="flex justify-end gap-3">
        {(displayStatus === "DRAFT" || displayStatus === "CALCULATING") && (
          <button
            onClick={handleCalculate}
            disabled={loading || displayStatus === "CALCULATING"}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {loading || displayStatus === "CALCULATING" ? "Calculating..." : "Calculate Run"}
          </button>
        )}
        {displayStatus === "REVIEW" && (
          <>
            <button
              onClick={handleCalculate}
              disabled={loading}
              className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 disabled:opacity-50"
            >
              Recalculate
            </button>
            <button
              onClick={handleApprove}
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? "Approving..." : "Approve Run"}
            </button>
          </>
        )}
        {displayStatus === "APPROVED" && (
          <button
            onClick={handleLock}
            disabled={loading}
            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
          >
            {loading ? "Locking..." : "Lock & Generate Payslips"}
          </button>
        )}
      </div>
    </div>
  );
}
