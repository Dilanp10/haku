import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@haku/shared";
import { openStateAt, type OpeningRange } from "@haku/core";

type HakuClient = SupabaseClient<Database, "public", any, any, any>;

export interface OpenInfo {
  closesAt: string; // "HH:MM"
}

export interface VenueStatusMap {
  open: Map<string, OpenInfo>;
  knownIds: Set<string>; // venues que tienen al menos un horario cargado
}

/** `Date` con la hora local de Catamarca (el dominio recibe la hora ya convertida). */
function catamarcaNow(): Date {
  const now = new Date();
  return new Date(now.toLocaleString("en-US", { timeZone: "America/Argentina/Catamarca" }));
}

/**
 * Adapter fino: consulta `venue_hours` y delega el cálculo de estado en `openStateAt`
 * (función de dominio pura de @haku/core). No reimplementa la lógica de apertura.
 */
export async function getVenueStatuses(client: HakuClient): Promise<VenueStatusMap> {
  const now = catamarcaNow();

  const [todayRes, allRes] = await Promise.all([
    client
      .from("venue_hours")
      .select("venue_id, day_of_week, opens_at, closes_at")
      .eq("day_of_week", now.getDay())
      .eq("closed", false),
    client.from("venue_hours").select("venue_id"),
  ]);

  const todayRows = (todayRes.data ?? []) as {
    venue_id: string;
    day_of_week: number;
    opens_at: string;
    closes_at: string;
  }[];

  // Agrupamos los rangos de hoy por venue y delegamos en el dominio.
  const rangesByVenue = new Map<string, OpeningRange[]>();
  for (const r of todayRows) {
    const list = rangesByVenue.get(r.venue_id) ?? [];
    list.push({ day: r.day_of_week, opensAt: r.opens_at, closesAt: r.closes_at });
    rangesByVenue.set(r.venue_id, list);
  }

  const open = new Map<string, OpenInfo>();
  for (const [venueId, ranges] of rangesByVenue) {
    const state = openStateAt(ranges, now);
    if (state.open && state.closesAt) open.set(venueId, { closesAt: state.closesAt });
  }

  const knownIds = new Set<string>();
  for (const r of (allRes.data ?? []) as { venue_id: string }[]) {
    knownIds.add(r.venue_id);
  }

  return { open, knownIds };
}

/** @deprecated Usar getVenueStatuses. */
export async function getOpenNowVenues(client: HakuClient): Promise<Map<string, OpenInfo>> {
  const { open } = await getVenueStatuses(client);
  return open;
}
