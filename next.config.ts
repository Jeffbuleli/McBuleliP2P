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
  async rewrites() {
    return [
      {
        source: "/@:handle",
        destination: "/community/u/:handle",
      },
      {
        source: "/%40:handle",
        destination: "/community/u/:handle",
      },
      {
        source: "/u/:handle",
        destination: "/community/u/:handle",
      },
    ];
  },
  async redirects() {
    return [
      {
        source: "/hackathon/ticket/:code",
        destination: "/hackathon/pass/:code",
        permanent: true,
      },
      {
        source: "/hackathon/galery",
        destination: "/hackathon/gallery",
        permanent: true,
      },
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
        source: "/app/wallet/groups",
        destination: "/app/eavec-handoff?next=%2Fapp%2Fwallet%2Fgroups",
        permanent: false,
      },
      {
        source: "/app/wallet/groups/:path*",
        destination: "/app/eavec-handoff?next=%2Fapp%2Fwallet%2Fgroups%2F:path*",
        permanent: false,
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
