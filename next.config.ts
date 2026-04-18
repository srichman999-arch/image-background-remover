import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // 只保留这一行，其他全部删掉
  output: "standalone",
};

export default nextConfig;
