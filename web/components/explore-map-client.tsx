"use client";

import { useState, useCallback } from "react";
import nextDynamic from "next/dynamic";
import type { ExplorePoint } from "./explore-map";
import { PlacesSheet } from "./places-sheet";
import { PlaceRow, type PlaceRowProps } from "./place-row";

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
      {/* Desktop: side panel + map */}
      <div className="hidden md:flex h-full">
        <aside
          className="w-[30%] min-w-[280px] max-w-[400px] shrink-0 overflow-y-auto border-r scrollbar-none"
          style={{ borderColor: "var(--line)", background: "var(--bg)" }}
        >
          <div className="px-4 py-3" style={{ borderBottom: "1px solid var(--line)" }}>
            <span className="text-xs font-bold uppercase tracking-widest" style={{ color: "var(--fg-50)" }}>
              {rows.length} abiertos ahora
            </span>
          </div>
          {rows.map((p) => (
            <div key={p.slug} data-slug={p.slug}>
              <PlaceRow
                {...p}
                selected={selectedSlug === p.slug}
                onSelect={() => handleSelect(p.slug)}
              />
            </div>
          ))}
          {rows.length === 0 && (
            <p className="px-5 py-8 text-center text-sm" style={{ color: "var(--fg-50)" }}>
              No hay lugares abiertos ahora.
            </p>
          )}
        </aside>
        <div className="flex-1">
          <ExploreMap
            points={points}
            selectedSlug={selectedSlug}
            onSelectSlug={handleSelect}
          />
        </div>
      </div>

      {/* Mobile: fullscreen map + bottom sheet */}
      <div className="md:hidden h-full">
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
      </div>
    </>
  );
}
