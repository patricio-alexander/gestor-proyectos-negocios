import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  basePath: "/raptorsolutions",
  // Self-update: build a .next-staging y luego se renombra a .next (ver update-apps.mjs).
  distDir: process.env.NEXT_DIST_DIR || ".next",
  experimental: {
    // Next 16 clona el body en middleware/proxy (default 10MB).
    // La subida real va por chunks de 2MB; este límite cubre fallbacks.
    proxyClientMaxBodySize: "100mb",
    serverActions: {
      bodySizeLimit: "100mb",
    },
  },
};

export default nextConfig;
