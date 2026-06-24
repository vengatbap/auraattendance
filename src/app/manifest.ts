import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "AURA Attendance",
    short_name: "AURA",
    description: "Face recognition attendance for site-based teams.",
    start_url: "/attendance",
    display: "standalone",
    background_color: "#020617",
    theme_color: "#2563eb",
    icons: [
      {
        src: "/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
      },
    ],
  };
}
