import type { NextConfig } from "next";

// No PWA wrapper here on purpose — admin is a desktop-first ops tool and
// keeping it a plain Next.js app keeps its bundle/build separate from the
// customer PWA's caching concerns.
const nextConfig: NextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "firebasestorage.googleapis.com" },
    ],
  },
};

export default nextConfig;
