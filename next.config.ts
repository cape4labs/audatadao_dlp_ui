import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    unoptimized: true, // иначе будут ошибки с Image-компонентом
  },
  basePath: "/dlp-ui-audata", 
  eslint: {
    ignoreDuringBuilds: true, 
  },
};

export default nextConfig;
