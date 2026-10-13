import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Camera, Check, X, LoaderCircle } from "lucide-react";
import { Input } from "@/components/ui/input";

export function PinPad({
  onSubmit,
  onCancel,
  busy,
}: {
  onSubmit: (employeeCode: string, pin: string) => void;
  onCancel: () => void;
  busy: boolean;
}) {
  const [employeeCode, setEmployeeCode] = useState("");
  const [pin, setPin] = useState("");
  const [step, setStep] = useState<"CODE" | "PIN">("CODE");

  const handleNum = (num: string) => {
    if (step === "CODE") setEmployeeCode((prev) => prev + num);
    else setPin((prev) => prev + num);
  };

  const handleBackspace = () => {
    if (step === "CODE") setEmployeeCode((prev) => prev.slice(0, -1));
    else setPin((prev) => prev.slice(0, -1));
  };

  const handleNext = () => {
    if (step === "CODE" && employeeCode.length > 0) {
      setStep("PIN");
    } else if (step === "PIN" && pin.length > 0) {
      onSubmit(employeeCode, pin);
    }
  };

  return (
    <div className="flex flex-col items-center w-full">
      <div className="mb-6 w-full space-y-4">
        {step === "CODE" ? (
          <div>
            <p className="text-sm text-slate-400 mb-2 font-medium">Enter Employee ID</p>
            <div className="h-14 rounded-2xl border border-slate-800 bg-slate-900 flex items-center justify-center text-2xl font-mono tracking-[0.2em] text-white overflow-hidden shadow-inner px-4">
              {employeeCode || <span className="text-slate-700 opacity-50 tracking-normal text-lg">Employee ID</span>}
            </div>
          </div>
        ) : (
          <div>
            <div className="flex justify-between items-center mb-2">
               <p className="text-sm text-slate-400 font-medium">Enter PIN</p>
               <button onClick={() => setStep("CODE")} className="text-xs text-blue-500 hover:text-blue-400">Change ID</button>
            </div>
            <div className="h-14 rounded-2xl border border-slate-800 bg-slate-900 flex items-center justify-center text-3xl tracking-[0.5em] text-white overflow-hidden shadow-inner">
              {pin.replace(/./g, "•") || <span className="text-slate-700 opacity-50 tracking-normal text-lg">PIN</span>}
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-3 gap-3 w-full max-w-[280px]">
        {["1", "2", "3", "4", "5", "6", "7", "8", "9"].map((num) => (
          <button
            key={num}
            onClick={() => handleNum(num)}
            className="h-14 rounded-2xl bg-slate-900 border border-slate-800 text-xl font-bold text-slate-200 hover:bg-slate-800 hover:text-white transition-colors shadow-sm active:scale-95"
            disabled={busy}
          >
            {num}
          </button>
        ))}
        <button
          onClick={handleBackspace}
          className="h-14 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-400 hover:bg-slate-800 hover:text-red-400 transition-colors shadow-sm active:scale-95"
          disabled={busy}
        >
          <X className="size-6" />
        </button>
        <button
          onClick={() => handleNum("0")}
          className="h-14 rounded-2xl bg-slate-900 border border-slate-800 text-xl font-bold text-slate-200 hover:bg-slate-800 hover:text-white transition-colors shadow-sm active:scale-95"
          disabled={busy}
        >
          0
        </button>
        <button
          onClick={handleNext}
          className="h-14 rounded-2xl bg-blue-600 hover:bg-blue-500 border border-blue-500 flex items-center justify-center text-white transition-colors shadow-lg shadow-blue-900/20 active:scale-95 disabled:opacity-50"
          disabled={busy || (step === "CODE" && !employeeCode) || (step === "PIN" && !pin)}
        >
          {busy ? <LoaderCircle className="size-6 animate-spin" /> : <Check className="size-6" />}
        </button>
      </div>

      <button
        onClick={onCancel}
        className="mt-8 flex items-center gap-2 text-sm text-slate-500 hover:text-slate-300 transition-colors"
        disabled={busy}
      >
        <Camera className="size-4" />
        Return to Face Scan
      </button>
    </div>
  );
}
