"use client";

import { useState, useCallback } from "react";
import nextDynamic from "next/dynamic";
import type { ExplorePoint } from "./explore-map";
import { PlacesSheet } from "./places-sheet";
import type { PlaceRowProps } from "./place-row";

const ExploreMap = nextDynamic(() => import("./explore-map"), {
  ssr: false,
  loading: () => (
    <div className="h-full w-full animate-pulse" style={{ background: "var(--card-2)" }} />
  ),
});

interface ExploreViewProps {
  points: ExplorePoint[];
  rows: Omit<PlaceRowProps, "selected" | "onSelect">[];
}

export function ExploreView({ points, rows }: ExploreViewProps) {
  const [selectedSlug, setSelectedSlug] = useState<string | null>(null);

  const handleSelect = useCallback((slug: string) => {
    setSelectedSlug((prev) => (prev === slug ? null : slug));
  }, []);

  return (
    <>
      <ExploreMap
        points={points}
        selectedSlug={selectedSlug}
        onSelectSlug={handleSelect}
      />
      <PlacesSheet
        places={rows}
        selectedSlug={selectedSlug}
        onSelectSlug={handleSelect}
      />
    </>
  );
}
