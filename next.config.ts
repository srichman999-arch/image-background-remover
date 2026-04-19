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
  eslint: {
    ignoreDuringBuilds: true,
  },
  // Cloudflare Pages 配置 - 使用 @cloudflare/next-on-pages
  // 不需要 output: 'export'，next-on-pages 会自动处理
};

export default nextConfig;
