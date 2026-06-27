"use client";

import React, { createContext, useContext, useEffect, ReactNode } from "react";

export interface BrandingConfig {
  logo?: string | null;
  favicon?: string | null;
  primaryColor?: string | null;
  secondaryColor?: string | null;
  companyName?: string | null;
  supportEmail?: string | null;
}

const BrandingContext = createContext<BrandingConfig>({
  logo: null,
  favicon: null,
  primaryColor: "#2563eb",
  secondaryColor: "#4f46e5",
  companyName: "AURA",
  supportEmail: null,
});

export function useBranding() {
  return useContext(BrandingContext);
}

function getContrastColor(hexColor: string): string {
  const cleanHex = hexColor.replace("#", "");
  if (cleanHex.length !== 6) return "#ffffff";
  const r = parseInt(cleanHex.substring(0, 2), 16);
  const g = parseInt(cleanHex.substring(2, 4), 16);
  const b = parseInt(cleanHex.substring(4, 6), 16);
  const yiq = (r * 299 + g * 587 + b * 114) / 1000;
  return yiq >= 150 ? "#020617" : "#ffffff";
}

interface BrandingProviderProps {
  config: BrandingConfig;
  children: ReactNode;
}

export function BrandingProvider({ config, children }: BrandingProviderProps) {
  const primary = config.primaryColor || "#2563eb";
  const secondary = config.secondaryColor || "#4f46e5";
  const primaryFg = getContrastColor(primary);
  const secondaryFg = getContrastColor(secondary);

  useEffect(() => {
    // Inject branding CSS variables into root document body
    const root = document.documentElement;
    root.style.setProperty("--primary", primary);
    root.style.setProperty("--primary-foreground", primaryFg);
    root.style.setProperty("--secondary", secondary);
    root.style.setProperty("--secondary-foreground", secondaryFg);
    root.style.setProperty("--sidebar-primary", primary);
    root.style.setProperty("--sidebar-primary-foreground", primaryFg);

    // Dynamic favicon updates if configured
    if (config.favicon) {
      const link = document.querySelector("link[rel~='icon']") as HTMLLinkElement;
      if (link) {
        link.href = config.favicon;
      }
    }

    // Dynamic document title updater if companyName configured
    if (config.companyName) {
      document.title = `${config.companyName} - Attendance`;
    }
  }, [primary, secondary, primaryFg, secondaryFg, config.favicon, config.companyName]);

  return (
    <BrandingContext.Provider value={config}>
      {children}
    </BrandingContext.Provider>
  );
}
