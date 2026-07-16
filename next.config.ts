import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  // Keep the Neon WebSocket driver + ws out of the bundle so frame masking
  // works at runtime (fixes "b.mask is not a function").
  serverExternalPackages: [
    "ws",
    "@prisma/client",
    "@prisma/adapter-neon",
    "@neondatabase/serverless",
  ],
  experimental: {
    // Allow base64 document data URLs to pass through Server Actions
    // (default limit is 1MB, which KYC/deposit uploads exceed).
    serverActions: {
      bodySizeLimit: "8mb",
    },
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
