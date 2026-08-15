"use client";

import { useEffect, useState } from "react";

export default function LeaveBalancesPage() {
  // In a real app we would have an employee selector, but for V1 minimal, we might just list them or require employee search.
  return (
    <div className="bg-[#121214] border border-zinc-800 rounded-xl p-6 text-center text-zinc-500">
      <h2 className="text-white mb-2">Leave Balances</h2>
      <p>Select an employee from the Directory to view their balances.</p>
    </div>
  );
}
