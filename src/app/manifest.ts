import type { MetadataRoute } from "next";
import { CANONICAL_PRODUCTION_ORIGIN } from "@/lib/app-url";

export default function manifest(): MetadataRoute.Manifest {
  return {
    /** Stable id on canonical origin - avoids treating www/legacy as a new app when possible */
    id: `${CANONICAL_PRODUCTION_ORIGIN}/`,
    name: "McBuleli",
    short_name: "McBuleli",
    description: "P2P crypto & mobile money - escrow wallet for Africa",
    start_url: "/",
    scope: "/",
    display: "standalone",
    launch_handler: {
      client_mode: "navigate-existing",
    },
    background_color: "#f4f6f5",
    theme_color: "#305f33",
    orientation: "any",
    icons: [
      {
        src: "/icons/icon-144.png",
        sizes: "144x144",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-256.png",
        sizes: "256x256",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-maskable-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "maskable",
      },
      {
        src: "/icons/icon-maskable-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
