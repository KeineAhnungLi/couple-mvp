import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: "20mb",
    },
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "cdn.shanjideutsch.site",
      },
    ],
    formats: ["image/avif", "image/webp"],
  },
};

export default nextConfig;
