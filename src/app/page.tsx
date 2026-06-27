"use client";

import Link from "next/link";
import { useState } from "react";
import {
  ArrowRight,
  ScanFace,
  ShieldCheck,
  LocateFixed,
  Clock,
  Sparkles,
  HelpCircle,
  Send,
  Laptop,
  CheckCircle2,
  Check,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

export default function MarketingLandingPage() {
  const [activeFaq, setActiveFaq] = useState<number | null>(null);
  const [contactForm, setContactForm] = useState({ name: "", email: "", message: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [demoStep, setDemoStep] = useState(0); // 0: Idle, 1: Scanning, 2: Matched!

  const handleContactSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!contactForm.name || !contactForm.email || !contactForm.message) {
      toast.error("Please fill in all contact form fields");
      return;
    }
    setIsSubmitting(true);
    setTimeout(() => {
      toast.success("Inquiry submitted! We'll contact you shortly.");
      setContactForm({ name: "", email: "", message: "" });
      setIsSubmitting(false);
    }, 1200);
  };

  const triggerDemo = () => {
    if (demoStep !== 0) return;
    setDemoStep(1);
    setTimeout(() => {
      setDemoStep(2);
    }, 2000);
  };

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
    <div className="min-h-screen bg-[#030712] text-slate-100 flex flex-col font-sans relative overflow-hidden selection:bg-blue-600 selection:text-white">
      {/* Decorative Gradients */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-blue-600/10 blur-[150px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-indigo-600/10 blur-[150px] pointer-events-none" />

      {/* Header */}
      <header className="sticky top-0 z-50 backdrop-blur-md border-b border-slate-900 bg-[#030712]/70">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="size-9 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-lg shadow-blue-600/20">
              <ScanFace className="size-5" />
            </div>
            <span className="font-extrabold text-lg tracking-tight bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
              AURA
            </span>
          </div>

          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-400">
            <a href="#features" className="hover:text-white transition">Features</a>
            <a href="#demo" className="hover:text-white transition">Interactive Demo</a>
            <a href="#pricing" className="hover:text-white transition">Pricing</a>
            <a href="#faq" className="hover:text-white transition">FAQ</a>
            <a href="#contact" className="hover:text-white transition">Contact</a>
          </nav>

          <div className="flex items-center gap-4">
            <Link href="/login" className="text-sm font-semibold hover:text-white transition text-slate-300">
              Log In
            </Link>
            <Link href="/signup">
              <Button className="bg-blue-600 hover:bg-blue-500 text-white font-semibold px-5 py-2.5 rounded-xl shadow-lg shadow-blue-600/20">
                Start Trial
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Body */}
      <main className="flex-1">
        {/* Hero Section */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-28 text-center space-y-8 relative">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-blue-500/30 bg-blue-500/5 text-blue-400 text-xs font-semibold">
            <Sparkles className="size-3.5" />
            Biometric Geofenced SaaS Platform
          </div>
          <h1 className="max-w-4xl mx-auto text-5xl sm:text-7xl font-extrabold tracking-tight leading-[1.08] text-white">
            Trustworthy Attendance. <br />
            <span className="bg-gradient-to-r from-blue-400 to-indigo-500 bg-clip-text text-transparent">
              Zero Room for Error.
            </span>
          </h1>
          <p className="max-w-2xl mx-auto text-base sm:text-lg text-slate-400 leading-relaxed">
            Eliminate buddy punching and time fraud. Aura uses secure face matching and location-based geofences to verify employees are at work in real time.
          </p>
          <div className="flex flex-wrap justify-center gap-4 pt-4">
            <Link href="/signup">
              <Button className="h-13 px-8 bg-blue-600 hover:bg-blue-500 text-white text-base font-bold rounded-xl shadow-xl shadow-blue-600/25">
                Register Your Company
                <ArrowRight className="ml-2 size-4" />
              </Button>
            </Link>
            <Link href="/attendance">
              <Button variant="outline" className="h-13 px-8 border-slate-800 text-slate-300 bg-slate-900/40 hover:bg-slate-800">
                Open Punch Kiosk
              </Button>
            </Link>
          </div>
        </section>

        {/* Live Attendance Demo Section */}
        <section id="demo" className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-20 border-t border-slate-900">
          <div className="grid lg:grid-cols-[1fr_1.1fr] gap-12 items-center">
            <div className="space-y-6">
              <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-white">
                See Aura in Action
              </h2>
              <p className="text-slate-400 text-base leading-relaxed">
                Click the interactive simulator on the right to see how quickly our biometrics match and confirm location bindings.
              </p>
              <ul className="space-y-4">
                {[
                  "Browser-level Face Matching via CDN models",
                  "Haversine geofence calculations (±1m resolution)",
                  "Automatic sync queue for offline punches",
                  "Direct audit logging on every check-in/out",
                ].map((item, idx) => (
                  <li key={idx} className="flex items-center gap-3 text-slate-300 text-sm">
                    <CheckCircle2 className="size-5 text-blue-500 shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
              <Button onClick={triggerDemo} disabled={demoStep !== 0} className="bg-blue-600 hover:bg-blue-500 px-6 py-3 rounded-xl font-bold">
                {demoStep === 0 && "Test Kiosk Simulator"}
                {demoStep === 1 && "Verifying Face..."}
                {demoStep === 2 && "Kiosk Verified!"}
              </Button>
            </div>

            {/* Simulated Mobile/Kiosk frame */}
            <div className="relative aspect-[4/3] rounded-3xl border border-slate-800 bg-slate-950 flex flex-col justify-between overflow-hidden shadow-2xl p-6">
              {/* Scan Guide Overlay */}
              {demoStep === 1 && (
                <div className="absolute inset-[15%_25%] rounded-[45%] border-2 border-dashed border-blue-500 animate-pulse pointer-events-none" />
              )}

              <header className="flex justify-between items-center z-10">
                <div className="flex items-center gap-2">
                  <div className="size-7 rounded-lg bg-blue-600 flex items-center justify-center text-white">
                    <ScanFace className="size-4" />
                  </div>
                  <span className="text-xs font-bold text-slate-300">Aura Kiosk</span>
                </div>
                <div className="text-[11px] font-mono font-semibold px-2 py-0.5 rounded-full bg-slate-900 border border-slate-800 text-slate-400">
                  10:15 AM
                </div>
              </header>

              {/* Central Screen State */}
              <div className="flex-1 flex flex-col items-center justify-center text-center py-4 z-10">
                {demoStep === 0 && (
                  <div className="space-y-3">
                    <div className="size-16 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-500 mx-auto">
                      <Laptop className="size-7" />
                    </div>
                    <p className="text-sm font-semibold text-white">Simulator Ready</p>
                    <p className="text-xs text-slate-400 max-w-xs">
                      Click the button on the left to start the simulated face recognition scan.
                    </p>
                  </div>
                )}

                {demoStep === 1 && (
                  <div className="space-y-3">
                    <p className="text-sm font-bold text-blue-400 animate-pulse">Scanning face & location...</p>
                    <p className="text-xs text-slate-400">GPS Proximity: checking SEEF geofence...</p>
                  </div>
                )}

                {demoStep === 2 && (
                  <div className="space-y-3 animate-scale-up">
                    <div className="size-14 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto border border-emerald-400/30 shadow-lg shadow-emerald-500/10">
                      <Check className="size-7 stroke-[3]" />
                    </div>
                    <div>
                      <p className="text-base font-bold text-white">Welcome Ahmed!</p>
                      <p className="text-xs text-emerald-400">Checked In · 10:15 AM</p>
                    </div>
                    <p className="text-[10px] text-slate-500">
                      Match Confidence: 94.2% · Location: SEEF Office (14m)
                    </p>
                    <button onClick={() => setDemoStep(0)} className="text-xs text-blue-500 underline mt-2 block mx-auto">
                      Reset Simulator
                    </button>
                  </div>
                )}
              </div>

              <footer className="flex justify-between items-center text-[10px] text-slate-500 border-t border-slate-900 pt-4 z-10">
                <span className="flex items-center gap-1">
                  <ShieldCheck className="size-3 text-blue-500" /> Secure Encryption
                </span>
                <span className="flex items-center gap-1">
                  <LocateFixed className="size-3 text-blue-500" /> Geofence Verified
                </span>
              </footer>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="bg-[#050b18]/60 py-24 border-t border-slate-900">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
            <div className="text-center space-y-4">
              <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-white">
                Everything You Need for Enterprise Tracking
              </h2>
              <p className="max-w-2xl mx-auto text-slate-400 text-sm sm:text-base">
                Aura combines cutting-edge biometrics, proximity geofences, and multi-tenant security configurations.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              {[
                {
                  icon: ScanFace,
                  title: "Guided Facial Enrolls",
                  desc: "A guided 5-step webcam setup matching profiles under multiple lighting configurations and rotations.",
                },
                {
                  icon: LocateFixed,
                  title: "Proximity GPS Geofences",
                  desc: "Forces checking coordinates against sites using server-verified Haversine calculation to block location spoofing.",
                },
                {
                  icon: Clock,
                  title: "Audit Trail Overrides",
                  desc: "Full logging tracking updates made by managers with complete snapshot history for state tracking.",
                },
              ].map((feat, idx) => (
                <div key={idx} className="p-8 rounded-2xl border border-slate-900 bg-slate-950/60 hover:border-slate-800 transition">
                  <div className="size-11 rounded-xl bg-blue-600/10 text-blue-500 flex items-center justify-center mb-6">
                    <feat.icon className="size-5" />
                  </div>
                  <h3 className="text-lg font-bold text-white mb-2">{feat.title}</h3>
                  <p className="text-slate-400 text-xs leading-relaxed">{feat.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Pricing Section */}
        <section id="pricing" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="text-center space-y-4 mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-white">Simple, Transparent Pricing</h2>
            <p className="text-slate-400 text-sm">Choose the tier that maps to your workforce size.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {[
              {
                title: "Free Trial",
                price: "$0",
                desc: "Explore Aura platform with standard biometrics.",
                features: ["1 Site", "Up to 5 Employees", "14-day history", "GPS Proximity bindings"],
                cta: "Register Trial",
                link: "/signup",
                popular: false,
              },
              {
                title: "Standard",
                price: "$49",
                desc: "For small-to-medium teams looking to verify punches.",
                features: ["5 Sites", "Up to 100 Employees", "Unlimited history", "Reports (CSV & Excel)", "Audit trails"],
                cta: "Start Standard",
                link: "/signup",
                popular: true,
              },
              {
                title: "Enterprise",
                price: "$199",
                desc: "For large organizations with strict auditing rules.",
                features: ["Unlimited Sites", "Unlimited Employees", "Biometric duplicate checks", "Priority support email", "Dedicated integration panel"],
                cta: "Get Enterprise",
                link: "/signup",
                popular: false,
              },
            ].map((plan, idx) => (
              <div
                key={idx}
                className={`p-8 rounded-3xl border flex flex-col justify-between relative bg-slate-950 ${
                  plan.popular ? "border-blue-600 shadow-2xl shadow-blue-600/5 scale-105 z-10" : "border-slate-900"
                }`}
              >
                {plan.popular && (
                  <span className="absolute top-0 right-8 -translate-y-1/2 bg-blue-600 text-white px-3 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wide">
                    Popular
                  </span>
                )}
                <div>
                  <h3 className="text-lg font-bold text-white">{plan.title}</h3>
                  <div className="mt-4 flex items-baseline gap-1">
                    <span className="text-4xl font-extrabold text-white">{plan.price}</span>
                    <span className="text-slate-400 text-xs">/month</span>
                  </div>
                  <p className="mt-2 text-slate-400 text-xs leading-relaxed">{plan.desc}</p>
                  <ul className="mt-6 space-y-3.5 border-t border-slate-900 pt-6">
                    {plan.features.map((f, i) => (
                      <li key={i} className="flex items-center gap-3 text-slate-300 text-xs">
                        <Check className="size-4 text-blue-500" />
                        {f}
                      </li>
                    ))}
                  </ul>
                </div>
                <Link href={plan.link} className="mt-8">
                  <Button
                    className={`w-full py-5 rounded-xl font-bold text-xs ${
                      plan.popular ? "bg-blue-600 hover:bg-blue-500 text-white" : "bg-slate-900 hover:bg-slate-800 text-slate-300"
                    }`}
                  >
                    {plan.cta}
                  </Button>
                </Link>
              </div>
            ))}
          </div>
        </section>

        {/* FAQ Section */}
        <section id="faq" className="bg-[#050b18]/60 py-24 border-t border-slate-900">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
            <h2 className="text-3xl font-bold tracking-tight text-white text-center">Frequently Asked Questions</h2>
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
          </div>
        </section>

        {/* Contact Form Section */}
        <section id="contact" className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="rounded-3xl border border-slate-900 bg-slate-950 p-8 sm:p-12 space-y-8">
            <div className="text-center space-y-2">
              <h2 className="text-3xl font-bold tracking-tight text-white">Have Questions? Reach Out</h2>
              <p className="text-slate-400 text-xs sm:text-sm">We reply to inquiries within 24 hours.</p>
            </div>

            <form onSubmit={handleContactSubmit} className="space-y-5 max-w-xl mx-auto">
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-slate-400">Your Name</label>
                  <Input
                    placeholder="John Doe"
                    value={contactForm.name}
                    onChange={(e) => setContactForm({ ...contactForm, name: e.target.value })}
                    className="bg-[#030712] border-slate-800 text-slate-100"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-slate-400">Email Address</label>
                  <Input
                    type="email"
                    placeholder="john@company.com"
                    value={contactForm.email}
                    onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })}
                    className="bg-[#030712] border-slate-800 text-slate-100"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-400">Message</label>
                <textarea
                  rows={4}
                  placeholder="Tell us about your workforce tracking needs..."
                  value={contactForm.message}
                  onChange={(e) => setContactForm({ ...contactForm, message: e.target.value })}
                  className="w-full rounded-lg bg-[#030712] border border-slate-800 text-slate-100 p-3 text-sm focus:outline-none focus:border-blue-600 transition placeholder:text-slate-600"
                />
              </div>
              <Button type="submit" disabled={isSubmitting} className="w-full bg-blue-600 hover:bg-blue-500 font-bold h-12 rounded-xl">
                {isSubmitting ? "Sending..." : "Submit Inquiry"}
                <Send className="ml-2 size-4" />
              </Button>
            </form>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-950 bg-[#02050c] text-slate-500 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <div className="size-8 rounded-lg bg-blue-600 flex items-center justify-center text-white">
              <ScanFace className="size-4.5" />
            </div>
            <span className="font-extrabold text-sm text-slate-200 tracking-tight">AURA</span>
          </div>

          <div className="flex gap-8 text-xs">
            <Link href="/privacy" className="hover:text-slate-300">Privacy Policy</Link>
            <Link href="/terms" className="hover:text-slate-300">Terms of Service</Link>
            <Link href="/faq" className="hover:text-slate-300">FAQ</Link>
            <Link href="/blog" className="hover:text-slate-300">Release Notes</Link>
          </div>

          <p className="text-[11px]">&copy; 2026 Aura Attendance, Inc. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
