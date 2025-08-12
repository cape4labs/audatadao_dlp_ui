const nextConfig = {
  webpack: (config) => {
    Object.assign(config, {
      output: {
        ...config.output,
        globalObject: `(typeof self !== 'undefined' ? self : this)`,
      },
    });

    return config;
  },
  images: {
    unoptimized: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  output: "standalone",
};

export default nextConfig;
