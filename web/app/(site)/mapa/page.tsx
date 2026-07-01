import type { Metadata } from "next";
import {
  listVenues,
  createSupabaseCoreRepository,
} from "@haku/core";
import {
  listUpcomingEvents,
  createSupabaseEventRepository,
} from "@haku/events";
import { createServerSupabase } from "@/lib/supabase/server";
import type { MapPoint } from "@/components/haku-map";
import { HakuMapClient } from "@/components/haku-map-client";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Mapa",
  description: "Mapa de lugares y eventos en Catamarca.",
};

export default async function MapaPage() {
  const supabase = await createServerSupabase();
  const coreRepo = createSupabaseCoreRepository(supabase);
  const eventsRepo = createSupabaseEventRepository(supabase);

  const [venuesRes, eventsRes] = await Promise.all([
    listVenues(coreRepo, { pagination: { page: 1, pageSize: 200 } }),
    listUpcomingEvents(eventsRepo, { limit: 100 }),
  ]);

  const venues = venuesRes.ok ? venuesRes.value.items : [];
  const events = eventsRes.ok ? eventsRes.value : [];

  const points: MapPoint[] = [
    ...venues
      .filter((v) => v.location !== null)
      .map((v) => ({
        slug: v.slug,
        name: v.name,
        lat: v.location!.lat,
        lng: v.location!.lng,
        kind: "venue" as const,
        meta: v.address ?? null,
      })),
    ...events
      .filter((e) => e.location !== null)
      .map((e) => ({
        slug: e.slug,
        name: e.title,
        lat: e.location!.lat,
        lng: e.location!.lng,
        kind: "event" as const,
        meta: e.venueName ?? null,
      })),
  ];

  const total = points.length;

  return (
    <main
      className="relative"
      style={{ height: "calc(100vh - 3.5rem - var(--bottom-nav-height, 80px))" }}
    >
      {/* Overlay header */}
      <div
        className="absolute top-0 inset-x-0 z-[1000] px-4 pt-4 pb-3 pointer-events-none"
        style={{
          background:
            "linear-gradient(to bottom, color-mix(in oklab, var(--bg) 92%, transparent) 0%, transparent 100%)",
        }}
      >
        <div className="pointer-events-auto">
          <p className="text-section">Mapa.</p>
          <p className="font-mono text-[11px] mt-0.5" style={{ color: "var(--moss)" }}>
            {total} punto{total === 1 ? "" : "s"} cargado{total === 1 ? "" : "s"} · {venues.length} lugar{venues.length === 1 ? "" : "es"} · {events.length} evento{events.length === 1 ? "" : "s"}
          </p>
        </div>
      </div>

      <HakuMapClient points={points} />
    </main>
  );
}
