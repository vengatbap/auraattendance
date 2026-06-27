"use client";

import Link from "next/link";
import { ScanFace, Calendar, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function BlogPage() {
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

      <main className="flex-grow max-w-2xl mx-auto px-4 py-20 w-full space-y-12">
        <div className="space-y-4">
          <h1 className="text-4xl font-extrabold text-white tracking-tight">Product Updates & Blog</h1>
          <p className="text-slate-400 text-sm">Changelogs, design insights, and company releases.</p>
        </div>

        <article className="border border-slate-900 rounded-3xl bg-slate-950 p-8 space-y-4">
          <div className="flex items-center gap-2 text-xs font-semibold text-blue-400">
            <Calendar className="size-3.5" />
            <span>June 27, 2026</span>
            <span>·</span>
            <span>Changelog</span>
          </div>
          <h2 className="text-2xl font-bold text-white leading-tight">Introducing Aura V1.0.0</h2>
          <p className="text-slate-400 text-xs sm:text-sm leading-relaxed">
            We are thrilled to launch the first production-ready version of Aura Attendance. Aura is designed to bridge the gap between simple, untrustworthy time tracking and premium enterprise auditing compliance.
          </p>
          <div className="space-y-2 pt-2 text-xs text-slate-300">
            <p className="font-bold text-white">What&apos;s new in this release:</p>
            <ul className="list-disc pl-5 space-y-1.5 text-slate-400">
              <li> guided 5-step biometric face enrollment.</li>
              <li>Haversine geofence calculations with browser coordinate locks.</li>
              <li>Custom corporate branding variables overrides.</li>
              <li>Centralized role-based access controls.</li>
              <li>Excel/CSV exports and printable audit logs.</li>
            </ul>
          </div>
        </article>
      </main>

      <footer className="border-t border-slate-900 py-6 text-center text-slate-600 text-[11px]">
        &copy; 2026 Aura Attendance, Inc. All rights reserved.
      </footer>
    </div>
  );
}
