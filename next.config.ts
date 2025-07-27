import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'export',
  trailingSlash: true,
  images: {
    unoptimized: true, // иначе будут ошибки с Image-компонентом
  },
  basePath: "/dlp-ui-audata", 
  eslint: {
    ignoreDuringBuilds: true, 
  },
};

export default nextConfig;
