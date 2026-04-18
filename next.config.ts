import type { NextConfig } from "next";

// 扩展 NextConfig 类型以支持 eslint 属性
type NextConfigWithEslint = NextConfig & {
  eslint?: {
    ignoreDuringBuilds?: boolean;
  };
};

const nextConfig: NextConfigWithEslint = {
  images: {
    unoptimized: true,
  },
  allowedDevOrigins: ['129.226.219.251'],
  typescript: {
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
