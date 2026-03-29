<<<<<<< HEAD
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: ['129.226.219.251'],
=======
/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "export",
  distDir: "out",
  images: {
    unoptimized: true,
  },
>>>>>>> a4f7fb3e4d3178473a9dc8610882478dff3c60e3
};

export default nextConfig;
