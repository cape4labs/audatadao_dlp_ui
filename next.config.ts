import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    unoptimized: true, // иначе будут ошибки с Image-компонентом
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  output: "standalone", // Необходимо для Docker
};

export default nextConfig;
