import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  async redirects() {
    return [
      // STICKO deployment: homepage opens the STICKO landing page.
      // Shiv Radium files are untouched — just not the front door here.
      { source: "/", destination: "/sticko", permanent: false },
    ];
  },
};

export default nextConfig;
