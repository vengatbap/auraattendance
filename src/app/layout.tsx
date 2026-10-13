import type { Metadata } from "next";
import "./globals.css";

import { cn } from "@/lib/utils";
import { Toaster } from "@/components/ui/sonner";
import { PwaRegister } from "@/components/pwa-register";

// Use local/system fallback if offline font fetching fails
let interVariable = "";
try {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { Inter } = require("next/font/google");
  const inter = Inter({ subsets: ["latin"], variable: "--font-sans", display: "swap" });
  interVariable = inter.variable;
} catch {
  interVariable = "";
}

export const metadata: Metadata = {
  title: "Aura - Attendance System",
  description: "Modern Face Recognition Attendance Management",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={cn("font-sans", interVariable, "dark")}>
      <body className="bg-slate-950 text-slate-50 antialiased">
        <PwaRegister />
        {children}
        <Toaster theme="dark" position="top-right" />
      </body>
    </html>
  );
}
