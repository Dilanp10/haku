"use client";

import nextDynamic from "next/dynamic";
import type { MapPoint } from "@/components/haku-map";

const HakuMap = nextDynamic(() => import("@/components/haku-map"), {
  ssr: false,
  loading: () => (
    <div
      className="h-full w-full animate-pulse"
      style={{ background: "var(--card-2)" }}
    />
  ),
});

export function HakuMapClient({ points }: { points: MapPoint[] }) {
  return <HakuMap points={points} />;
}
