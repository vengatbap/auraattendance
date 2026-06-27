"use client";

import Link from "next/link";
import { ScanFace, LocateFixed, Clock, ShieldCheck, Laptop } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function FeaturesPage() {
  const list = [
    {
      icon: ScanFace,
      title: "Facial Biometrics Engine",
      desc: "Our platform processes high-performance deep learning face landmarking directly on user devices to generate safe 128-dimensional embedding vectors.",
    },
    {
      icon: LocateFixed,
      title: "Server-side GPS Geofences",
      desc: "Authenticates actual employee coordinate metrics against approved work perimeters using server-side Haversine mathematical distance filters.",
    },
    {
      icon: Clock,
      title: "Real-time Attendance Timeline",
      desc: "Check-in and check-out logs register instantly on the managers' dashboard with complete photo verification, distance logs, and device parameters.",
    },
    {
      icon: ShieldCheck,
      title: "Audit trail transparency",
      desc: "Any manual adjustment written to a worker's shift logs is recorded in full with before/after state snapshots and logging reasons.",
    },
  ];

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

      <main className="flex-grow max-w-4xl mx-auto px-4 py-20 space-y-12">
        <div className="text-center space-y-4">
          <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-white">Platform Features</h1>
          <p className="max-w-2xl mx-auto text-slate-400 text-sm sm:text-base">
            Detailed breakdown of our security safeguards, geofence parameters, and biometrics.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 pt-8">
          {list.map((item, i) => (
            <div key={i} className="p-8 rounded-2xl border border-slate-900 bg-slate-950">
              <div className="size-11 rounded-xl bg-blue-600/10 text-blue-500 flex items-center justify-center mb-6">
                <item.icon className="size-5" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">{item.title}</h3>
              <p className="text-slate-400 text-xs leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </main>

      <footer className="border-t border-slate-900 py-6 text-center text-slate-600 text-[11px]">
        &copy; 2026 Aura Attendance, Inc. All rights reserved.
      </footer>
    </div>
  );
}
