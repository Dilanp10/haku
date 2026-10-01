import type { Metadata } from "next";
import {
  listVenues,
  listCategories,
  createSupabaseCoreRepository,
  type Category,
} from "@haku/core";
import {
  listUpcomingEvents,
  createSupabaseEventRepository,
} from "@haku/events";
import { createServerSupabase } from "@/lib/supabase/server";
import { getVenueStatuses } from "@/lib/venue-open-now";
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

  const [venuesRes, categoriesRes, eventsRes, statuses] = await Promise.all([
    listVenues(coreRepo, { pagination: { page: 1, pageSize: 100 } }),
    listCategories(coreRepo),
    listUpcomingEvents(eventsRepo, { limit: 100 }),
    getVenueStatuses(supabase),
  ]);

  const venues = venuesRes.ok ? venuesRes.value.items : [];
  const categories = categoriesRes.ok ? categoriesRes.value : [];
  const events = eventsRes.ok ? eventsRes.value : [];
  const catById = new Map<string, Category>(categories.map((c) => [c.id, c]));

  let openCount = 0;
  let closedCount = 0;

  const points: MapPoint[] = [
    ...venues
      .filter((v) => v.location !== null)
      .map((v) => {
        const open = statuses.open.get(v.id);
        const known = statuses.knownIds.has(v.id);
        const status: "open" | "closed" | "unknown" = open
          ? "open"
          : known
            ? "closed"
            : "unknown";
        if (status === "open") openCount++;
        else if (status === "closed") closedCount++;
        const cat = catById.get(v.categoryId);
        return {
          slug: v.slug,
          name: v.name,
          lat: v.location!.lat,
          lng: v.location!.lng,
          kind: "venue" as const,
          meta: v.address ?? null,
          category: cat?.name ?? null,
          neighborhood: v.neighborhood ?? null,
          status,
          closesAt: open?.closesAt ?? null,
        };
      }),
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
          <p className="font-mono text-[11px] mt-0.5">
            <span style={{ color: "var(--success-fg)" }}>● {openCount} abierto{openCount === 1 ? "" : "s"}</span>
            <span style={{ color: "var(--fg-30)" }}> · </span>
            <span style={{ color: "var(--danger)" }}>● {closedCount} cerrado{closedCount === 1 ? "" : "s"}</span>
            {events.length > 0 && (
              <>
                <span style={{ color: "var(--fg-30)" }}> · </span>
                <span style={{ color: "var(--success-fg)" }}>{events.length} evento{events.length === 1 ? "" : "s"}</span>
              </>
            )}
          </p>
        </div>
      </div>

      <HakuMapClient points={points} />
    </main>
  );
}
