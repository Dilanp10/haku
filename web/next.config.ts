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
    ],
  },
};

export default nextConfig;
