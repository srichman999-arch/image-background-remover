import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    unoptimized: true,
  },
  // Cloudflare Pages 使用 @cloudflare/next-on-pages 适配器
  // 不需要设置 output: 'export' 或 output: 'standalone'
};

export default nextConfig;
