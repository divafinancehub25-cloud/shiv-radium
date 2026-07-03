import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  async redirects() {
    // STICKO Vercel project sets STICKO_DEPLOY=1 so its homepage stays /sticko.
    // Shiv Radium deployment (no env var) keeps its own homepage.
    if (process.env.STICKO_DEPLOY === "1") {
      return [{ source: "/", destination: "/sticko", permanent: false }];
    }
    return [];
  },
};

export default nextConfig;
