import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "a.ltrbxd.com",
      },
    ],
  },
};

export default nextConfig;
