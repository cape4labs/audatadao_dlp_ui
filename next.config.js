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
  eslint: {
    ignoreDuringBuilds: true,
  },
  output: "standalone",
};

module.exports = nextConfig;
