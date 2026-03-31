import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",
  distDir: "out",
  images: {
    unoptimized: true,
  },
  allowedDevOrigins: ['129.226.219.251'],
  env: {
    NEXT_PUBLIC_REMOVE_BG_API_KEY: process.env.REMOVE_BG_API_KEY,
  },
};

export default nextConfig;