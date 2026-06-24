import type { Metadata } from "next";
import "./globals.css";
import { Inter } from "next/font/google";
import { cn } from "@/lib/utils";
import { Toaster } from "@/components/ui/sonner";
import { PwaRegister } from "@/components/pwa-register";

const inter = Inter({subsets:['latin'],variable:'--font-sans'});

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
    <html lang="en" className={cn("font-sans", inter.variable, "dark")}>
      <body className="bg-slate-950 text-slate-50 antialiased">
        <PwaRegister />
        {children}
        <Toaster theme="dark" position="top-right" />
      </body>
    </html>
  );
}
