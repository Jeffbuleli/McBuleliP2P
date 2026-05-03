import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "McBuleli P2P",
    short_name: "McBuleli",
    description:
      "Centralised-style crypto flows with Binance & OKX-backed validation",
    start_url: "/",
    display: "standalone",
    background_color: "#14532d",
    theme_color: "#15803d",
    orientation: "portrait-primary",
    icons: [
      {
        src: "/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "any",
      },
    ],
  };
}
