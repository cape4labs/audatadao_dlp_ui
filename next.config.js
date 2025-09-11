const nextConfig = {
  webpack: (config) => {
    config.output.publicPath = "/_next/";
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
