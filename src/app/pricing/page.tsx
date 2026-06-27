"use client";

import Link from "next/link";
import { ScanFace, Check, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-[#030712] text-slate-100 flex flex-col font-sans relative overflow-hidden">
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-blue-600/10 blur-[150px] pointer-events-none" />

      {/* Header */}
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

      <main className="flex-grow max-w-5xl mx-auto px-4 py-20 text-center space-y-16">
        <div className="space-y-4">
          <h1 className="text-4xl sm:text-6xl font-extrabold text-white tracking-tight">Flexible SaaS Subscription Plans</h1>
          <p className="max-w-2xl mx-auto text-slate-400 text-sm sm:text-base">
            Whether you have 5 employees at a single site or thousands across multiple locations, Aura scales to fit your business.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {[
            {
              title: "Free Trial",
              price: "$0",
              desc: "14-day exploration trial.",
              features: ["1 Active Site", "Up to 5 Employees", "GPS Proximity bindings", "Standard face matching"],
              link: "/signup",
            },
            {
              title: "Standard",
              price: "$49",
              desc: "For small-to-medium teams.",
              features: ["5 Active Sites", "Up to 100 Employees", "CSV & Excel reports", "Manual adjustments logs", "SMTP custom logs"],
              link: "/signup",
            },
            {
              title: "Enterprise",
              price: "$199",
              desc: "For multi-site corporations.",
              features: ["Unlimited Sites", "Unlimited Employees", "Biometric duplicate checks", "Priority support email", "Integration widgets"],
              link: "/signup",
            },
          ].map((plan, i) => (
            <div key={i} className="p-8 rounded-3xl border border-slate-900 bg-slate-950 flex flex-col justify-between text-left">
              <div>
                <h3 className="text-lg font-bold text-white">{plan.title}</h3>
                <div className="mt-4 flex items-baseline gap-1">
                  <span className="text-4xl font-extrabold text-white">{plan.price}</span>
                  <span className="text-slate-400 text-xs">/month</span>
                </div>
                <p className="mt-2 text-slate-400 text-xs leading-relaxed">{plan.desc}</p>
                <ul className="mt-6 space-y-3 pt-6 border-t border-slate-900">
                  {plan.features.map((f, idx) => (
                    <li key={idx} className="flex items-center gap-3 text-slate-300 text-xs">
                      <Check className="size-4 text-blue-500" />
                      {f}
                    </li>
                  ))}
                </ul>
              </div>
              <Link href={plan.link} className="mt-8">
                <Button className="w-full bg-blue-600 hover:bg-blue-500 font-bold py-5 rounded-xl text-xs text-white">
                  Get Started
                  <ArrowRight className="ml-2 size-3.5" />
                </Button>
              </Link>
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
