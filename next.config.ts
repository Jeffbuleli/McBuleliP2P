import type { NextConfig } from "next";
import { mediaPublicHostnames } from "./src/lib/media-url-config";
import { securityResponseHeaders } from "./src/lib/security-headers";

const nextConfig: NextConfig = {
  // Required by ops/vps/Dockerfile (standalone Node server)
  output: "standalone",
  poweredByHeader: false,
  serverExternalPackages: ["ccxt", "technicalindicators", "postgres"],
  images: {
    remotePatterns: [
      ...mediaPublicHostnames().map((hostname) => ({
        protocol: "https" as const,
        hostname,
      })),
      {
        protocol: "https",
        hostname: "**.r2.dev",
      },
    ],
  },
  async headers() {
    const entries = Object.entries(securityResponseHeaders());
    return [
      {
        source: "/:path*",
        headers: entries.map(([key, value]) => ({ key, value })),
      },
    ];
  },
  async redirects() {
    return [
      {
        source: "/app/deposit/:id",
        destination: "/app/wallet/deposit/:id",
        permanent: true,
      },
      {
        source: "/app/deposit",
        destination: "/app/wallet/deposit",
        permanent: true,
      },
      {
        source: "/app/withdraw",
        destination: "/app/wallet/withdraw",
        permanent: true,
      },
      {
        source: "/app/wallet/fiat",
        destination: "/app/wallet",
        permanent: true,
      },
      {
        source: "/:path*",
        has: [{ type: "host", value: "mcbuleli.online" }],
        destination: "https://mcbuleli.org/:path*",
        permanent: true,
      },
      {
        source: "/:path*",
        has: [{ type: "host", value: "www.mcbuleli.online" }],
        destination: "https://mcbuleli.org/:path*",
        permanent: true,
      },
      {
        source: "/:path*",
        has: [{ type: "host", value: "www.mcbuleli.org" }],
        destination: "https://mcbuleli.org/:path*",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
