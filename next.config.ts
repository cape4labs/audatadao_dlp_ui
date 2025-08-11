import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    unoptimized: true, // иначе будут ошибки с Image-компонентом
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  webpack: (config) => {
    config.output.clean = true;
    return config;
  },
  output: "standalone", // Необходимо для Docker
};

export default nextConfig;
