import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: "/validation-key.txt",
        destination: "/api/domain-validation-key",
      },
    ];
  },
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
