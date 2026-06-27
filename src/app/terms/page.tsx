"use client";

import Link from "next/link";
import { ScanFace } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-[#030712] text-slate-100 flex flex-col font-sans relative overflow-hidden">
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-blue-600/10 blur-[150px] pointer-events-none" />

      <header className="border-b border-slate-900 bg-[#030712]/70">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <div className="size-9 rounded-xl bg-blue-600 flex items-center justify-center text-white">
              <ScanFace className="size-5" />
            </div>
            <span className="font-extrabold text-lg tracking-tight text-white">AURA</span>
          </Link>
          <Link href="/">
            <Button variant="ghost" className="text-slate-300 hover:text-white">Back to Home</Button>
          </Link>
        </div>
      </header>

      <main className="flex-grow max-w-3xl mx-auto px-4 py-20 space-y-6">
        <h1 className="text-3xl font-extrabold text-white">Terms of Service</h1>
        <p className="text-xs text-slate-400">Last updated: June 27, 2026</p>

        <div className="space-y-4 text-slate-300 text-sm leading-relaxed">
          <p>
            Welcome to Aura. By accessing our software services, you agree to comply with the following Terms.
          </p>
          <h2 className="text-lg font-bold text-white mt-6">1. Usage License</h2>
          <p>
            We grant subscription holders a limited, non-exclusive, non-transferable license to access our platform solely for authorized workforce tracking purposes.
          </p>
          <h2 className="text-lg font-bold text-white mt-6">2. Subscription Trials</h2>
          <p>
            Free trial subscriptions run for exactly 14 days. Upon expiration, accounts must enter valid billing details to retain active biometric databases and geofence sites.
          </p>
        </div>
      </main>

      <footer className="border-t border-slate-900 py-6 text-center text-slate-600 text-[11px]">
        &copy; 2026 Aura Attendance, Inc. All rights reserved.
      </footer>
    </div>
  );
}
