"use client";

import Link from "next/link";
import { useState } from "react";
import { ScanFace, HelpCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function FAQPage() {
  const [activeFaq, setActiveFaq] = useState<number | null>(null);

  const faqs = [
    {
      q: "How does the face recognition system verify identities?",
      a: "Our system runs high-performance deep learning models on the browser to detect facial landmarks and convert them into a mathematically unique 128-dimensional vector (embedding). We never store raw photos for matching—only secure vector hashes. These vectors are compared on the server using cosine similarity to confirm identity.",
    },
    {
      q: "What is geofencing and how does it prevent punch tampering?",
      a: "Geofencing uses browser-level GPS coordinates to verify that an employee is physically located within the approved perimeter of a job site (e.g. 50 meters) at the exact moment they punch in. Coordinates are locked and distance checks are computed on the server side using the Haversine distance algorithm, preventing GPS spoofing.",
    },
    {
      q: "Does the system support offline logs if Internet goes down?",
      a: "Yes! Aura features offline capability. If a device loses Internet access, attendance logs are securely cached in local storage. Once the connection is re-established, the kiosk automatically synchronizes the pending punches back to the central database in the background.",
    },
    {
      q: "Can we install Aura on a wall-mounted tablet?",
      a: "Aura is designed as a fully responsive Progressive Web App (PWA). You can mount any modern iOS or Android tablet on a wall, lock it in kiosk mode, and open the attendance scanner URL. It adapts dynamically to tablets, kiosks, and mobile viewports.",
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

      <main className="flex-grow max-w-3xl mx-auto px-4 py-20 space-y-12">
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-extrabold text-white tracking-tight">Frequently Asked Questions</h1>
          <p className="text-slate-400 text-sm">Got questions about Aura? We have answers.</p>
        </div>

        <div className="space-y-4">
          {faqs.map((faq, idx) => (
            <div key={idx} className="border border-slate-900 rounded-2xl bg-slate-950 overflow-hidden">
              <button
                onClick={() => setActiveFaq(activeFaq === idx ? null : idx)}
                className="w-full p-6 text-left flex justify-between items-center gap-4"
              >
                <span className="font-bold text-slate-200 text-sm sm:text-base">{faq.q}</span>
                <HelpCircle className={`size-5 text-slate-400 shrink-0 transition-transform ${activeFaq === idx ? "rotate-180" : ""}`} />
              </button>
              {activeFaq === idx && (
                <div className="px-6 pb-6 text-slate-400 text-xs sm:text-sm leading-relaxed border-t border-slate-900/60 pt-4">
                  {faq.a}
                </div>
              )}
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
