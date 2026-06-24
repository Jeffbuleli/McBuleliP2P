import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["ccxt", "technicalindicators", "postgres"],
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "raw.githubusercontent.com",
        pathname: "/spothq/cryptocurrency-icons/**",
      },
    ],
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
