"use client";

import nextDynamic from "next/dynamic";
import { useState } from "react";
import { ChevronDown, MapPin } from "lucide-react";
import type { MapPoint } from "@/components/haku-map";

const HakuMap = nextDynamic(() => import("@/components/haku-map"), {
  ssr: false,
  loading: () => (
    <div
      className="h-full w-full animate-pulse rounded-[12px]"
      style={{ background: "var(--card-2)" }}
    />
  ),
});

export interface EventsMiniMapProps {
  points: MapPoint[];
  totalCount: number;
  /** Rango de días hacia adelante que muestra el mapa. */
  windowDays?: number;
  /** Si está abierto por default (desktop). */
  defaultOpen?: boolean;
}

export function EventsMiniMap({ points, totalCount, windowDays = 2, defaultOpen = false }: EventsMiniMapProps) {
  const [open, setOpen] = useState(defaultOpen);

  if (points.length === 0) return null;

  const n = points.length;
  const eventWord = n === 1 ? "evento" : "eventos";
  const dayLabel = windowDays === 1 ? "las próximas 24 h" : `los próximos ${windowDays} días`;
  const label = `Ver en el mapa · ${n} ${eventWord} en ${dayLabel}`;

  return (
    <section
      className="mb-6 overflow-hidden rounded-[12px] border"
      style={{ borderColor: "var(--line)", background: "var(--card-bg)" }}
    >
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex w-full items-center justify-between px-4 py-3 text-left transition hover:bg-[var(--muted-bg)]"
      >
        <span className="inline-flex items-center gap-2 text-sm font-medium" style={{ color: "var(--fg)" }}>
          <MapPin className="h-4 w-4" style={{ color: "var(--terra)" }} />
          {label}
        </span>
        <ChevronDown
          className="h-4 w-4 transition-transform"
          style={{
            color: "var(--fg-50)",
            transform: open ? "rotate(180deg)" : "rotate(0deg)",
          }}
        />
      </button>

      {open && (
        <>
          <div className="h-[240px] md:h-[320px]">
            <HakuMap points={points} />
          </div>
          <p
            className="border-t px-4 py-2 text-xs"
            style={{ borderColor: "var(--line)", color: "var(--fg-50)" }}
          >
            Tocá un pin para ver el detalle del evento.
            {points.length < totalCount && (
              <>
                {" "}Hay {totalCount - points.length} evento
                {totalCount - points.length !== 1 ? "s" : ""} más abajo que no entran en este rango o no tienen ubicación.
              </>
            )}
          </p>
        </>
      )}
    </section>
  );
}
