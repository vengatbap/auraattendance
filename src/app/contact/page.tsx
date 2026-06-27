"use client";

import Link from "next/link";
import { useState } from "react";
import { ScanFace, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

export default function ContactPage() {
  const [form, setForm] = useState({ name: "", email: "", message: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.message) {
      toast.error("Please fill in all fields.");
      return;
    }
    setIsSubmitting(true);
    setTimeout(() => {
      toast.success("Message sent successfully!");
      setForm({ name: "", email: "", message: "" });
      setIsSubmitting(false);
    }, 1000);
  };

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

      <main className="flex-grow max-w-xl mx-auto px-4 py-20 w-full">
        <div className="rounded-3xl border border-slate-900 bg-slate-950 p-8 sm:p-12 space-y-6">
          <div className="text-center space-y-2">
            <h1 className="text-3xl font-extrabold text-white">Contact Us</h1>
            <p className="text-slate-400 text-xs sm:text-sm">Get in touch with our product experts.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-400">Full Name</label>
              <Input
                placeholder="John Doe"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="bg-[#030712] border-slate-800 text-slate-100"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-400">Email Address</label>
              <Input
                type="email"
                placeholder="john@company.com"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="bg-[#030712] border-slate-800 text-slate-100"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-400">Message</label>
              <textarea
                rows={4}
                placeholder="Describe your request..."
                value={form.message}
                onChange={(e) => setForm({ ...form, message: e.target.value })}
                className="w-full rounded-lg bg-[#030712] border border-slate-800 text-slate-100 p-3 text-sm focus:outline-none focus:border-blue-600 transition placeholder:text-slate-600"
              />
            </div>
            <Button type="submit" disabled={isSubmitting} className="w-full bg-blue-600 hover:bg-blue-500 font-bold h-12 rounded-xl text-white">
              {isSubmitting ? "Sending..." : "Send Message"}
              <Send className="ml-2 size-4" />
            </Button>
          </form>
        </div>
      </main>

      <footer className="border-t border-slate-900 py-6 text-center text-slate-600 text-[11px]">
        &copy; 2026 Aura Attendance, Inc. All rights reserved.
      </footer>
    </div>
  );
}
