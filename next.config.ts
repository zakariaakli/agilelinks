import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  experimental: {
    esmExternals: "loose",
  },
  webpack: (config, { isServer }) => {
    if (isServer) {
      config.externals = config.externals || [];
      config.externals.push({
        '@opentelemetry/api': 'commonjs @opentelemetry/api',
        '@opentelemetry/sdk-node': 'commonjs @opentelemetry/sdk-node',
        '@opentelemetry/auto-instrumentations-node': 'commonjs @opentelemetry/auto-instrumentations-node',
      });
    }
    return config;
  },
};

export default nextConfig;
