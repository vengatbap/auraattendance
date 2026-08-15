"use client";

export default function PrintButton() {
  return (
    <button 
      onClick={() => window.print()}
      className="px-4 py-2 bg-blue-600 text-white rounded shadow hover:bg-blue-700"
    >
      Print Payslip
    </button>
  );
}
