import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: ["192.168.0.9"],
  images: {
    qualities: [55, 75],
  },
};

export default nextConfig;
