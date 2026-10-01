"use client";

import { useState, useRef, useEffect } from "react";
import { ChevronUp } from "lucide-react";
import { PlaceRow, type PlaceRowProps } from "./place-row";

interface PlacesSheetProps {
  places: Omit<PlaceRowProps, "selected" | "onSelect">[];
  selectedSlug: string | null;
  onSelectSlug: (slug: string) => void;
}

export function PlacesSheet({ places, selectedSlug, onSelectSlug }: PlacesSheetProps) {
  const [expanded, setExpanded] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (selectedSlug && listRef.current) {
      const el = listRef.current.querySelector(`[data-slug="${selectedSlug}"]`);
      el?.scrollIntoView({ block: "nearest", behavior: "smooth" });
    }
  }, [selectedSlug]);

  return (
    <div
      className="absolute inset-x-0 bottom-[var(--bottom-nav-height,72px)] z-[1000] flex flex-col rounded-t-2xl shadow-lg transition-[max-height] duration-300 ease-out md:hidden"
      style={{
        background: "var(--bg)",
        maxHeight: expanded ? "60vh" : "220px",
      }}
    >
      <button
        type="button"
        className="flex w-full items-center justify-between px-5 py-3"
        style={{ borderBottom: "1px solid var(--line)" }}
        onClick={() => setExpanded((v) => !v)}
      >
        <span className="text-xs font-bold uppercase tracking-widest" style={{ color: "var(--fg-50)" }}>
          {places.length} abiertos ahora
        </span>
        <ChevronUp
          size={18}
          className="transition-transform duration-200"
          style={{
            color: "var(--fg-30)",
            transform: expanded ? "rotate(180deg)" : "rotate(0deg)",
          }}
        />
      </button>

      <div ref={listRef} className="flex-1 overflow-y-auto scrollbar-none">
        {places.map((p) => (
          <div key={p.slug} data-slug={p.slug}>
            <PlaceRow
              {...p}
              selected={selectedSlug === p.slug}
              onSelect={() => onSelectSlug(p.slug)}
            />
          </div>
        ))}
        {places.length === 0 && (
          <p className="px-5 py-8 text-center text-sm" style={{ color: "var(--fg-50)" }}>
            No hay lugares abiertos ahora.
          </p>
        )}
      </div>
    </div>
  );
}
