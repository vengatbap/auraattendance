"use client";

import Link from "next/link";
import { ScanFace } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function PrivacyPage() {
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
        <h1 className="text-3xl font-extrabold text-white">Privacy Policy</h1>
        <p className="text-xs text-slate-400">Last updated: June 27, 2026</p>
        
        <div className="space-y-4 text-slate-300 text-sm leading-relaxed">
          <p>
            At Aura, we take the privacy of your workforce biometrics and geolocations seriously. This Policy outlines how we collect, protect, and process credentials.
          </p>
          <h2 className="text-lg font-bold text-white mt-6">1. Biometric Data Protection</h2>
          <p>
            We process live camera streams directly on client devices (webcams or tablets) to extract facial landmarks. Only the resulting 128-dimensional embedding vectors (hashes) are securely sent to our database. Aura never stores or transfers raw photos of employees for verification.
          </p>
          <h2 className="text-lg font-bold text-white mt-6">2. Geolocation Processing</h2>
          <p>
            GPS coordinates are obtained via browser location APIs solely at the moment of check-in and check-out to verify proximity bindings. We do not track employees dynamically or monitor locations outside of punch events.
          </p>
        </div>
      </main>

      <footer className="border-t border-slate-900 py-6 text-center text-slate-600 text-[11px]">
        &copy; 2026 Aura Attendance, Inc. All rights reserved.
      </footer>
    </div>
  );
}
