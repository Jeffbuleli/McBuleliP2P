import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "McBuleli",
    short_name: "McBuleli",
    description: "P2P crypto & mobile money — escrow wallet for Africa",
    start_url: "/app",
    display: "standalone",
    background_color: "#0c0a09",
    theme_color: "#166534",
    orientation: "portrait-primary",
    icons: [
      {
        src: "/brand/logo.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/brand/logo.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
