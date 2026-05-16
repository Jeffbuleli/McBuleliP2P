import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["ccxt", "technicalindicators"],
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "raw.githubusercontent.com",
        pathname: "/spothq/cryptocurrency-icons/**",
      },
    ],
  },
};

export default nextConfig;
