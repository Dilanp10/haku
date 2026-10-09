import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  transpilePackages: ["@haku/shared", "@haku/core", "@haku/auth", "@haku/events"],
  ...(process.env.NEXT_OUTPUT === "standalone" ? { output: "standalone" as const } : {}),
  experimental: {},
  images: {
    remotePatterns: [
      // Supabase Storage (produccion: <project>.supabase.co)
      { protocol: "https", hostname: "**.supabase.co" },
      { protocol: "https", hostname: "**.supabase.in" },
      // Supabase local (supabase start)
      { protocol: "http", hostname: "localhost", port: "54321" },
      { protocol: "http", hostname: "127.0.0.1", port: "54321" },
      // Fuentes de eventos (turismo SFVC + apps gobierno Catamarca)
      { protocol: "https", hostname: "turismo.apps.cc.gob.ar" },
      { protocol: "https", hostname: "**.cc.gob.ar" },
      { protocol: "https", hostname: "**.catamarca.gob.ar" },
    ],
  },
};

export default nextConfig;
