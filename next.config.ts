import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",
  distDir: "out",
  images: {
    unoptimized: true,
  },
  allowedDevOrigins: ['129.226.219.251'],
};

export default nextConfig;
