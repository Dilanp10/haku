"use client";

import nextDynamic from "next/dynamic";
import type { ComponentProps } from "react";
import type { VenueMap } from "@/components/venue-map";

const VenueMapInner = nextDynamic(
  () => import("@/components/venue-map").then((m) => m.VenueMap),
  {
    ssr: false,
    loading: () => (
      <div
        className="h-80 w-full rounded-lg animate-pulse"
        style={{ background: "var(--card-2)" }}
      />
    ),
  },
);

type Props = ComponentProps<typeof VenueMap>;

export function VenueMapClient(props: Props) {
  return <VenueMapInner {...props} />;
}
