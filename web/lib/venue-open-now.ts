import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@haku/shared";

type HakuClient = SupabaseClient<Database, "public", any, any, any>;

export interface OpenInfo {
  closesAt: string; // "HH:MM"
}

export interface VenueStatusMap {
  open: Map<string, OpenInfo>;
  knownIds: Set<string>; // venues que tienen al menos un horario cargado
}

/**
 * Devuelve el mapa de venues abiertos ahora + el set de venues con horarios conocidos.
 * Todo en una consulta doble (hoy + distinct any-day).
 */
export async function getVenueStatuses(client: HakuClient): Promise<VenueStatusMap> {
  const now = new Date();
  const argTime = new Date(
    now.toLocaleString("en-US", { timeZone: "America/Argentina/Catamarca" }),
  );
  const dow = argTime.getDay();
  const hh = String(argTime.getHours()).padStart(2, "0");
  const mm = String(argTime.getMinutes()).padStart(2, "0");
  const timeStr = `${hh}:${mm}:00`;

  const [todayRes, allRes] = await Promise.all([
    client
      .from("venue_hours")
      .select("venue_id, opens_at, closes_at")
      .eq("day_of_week", dow)
      .eq("closed", false),
    client.from("venue_hours").select("venue_id"),
  ]);

  const open = new Map<string, OpenInfo>();
  const todayRows = (todayRes.data ?? []) as {
    venue_id: string;
    opens_at: string;
    closes_at: string;
  }[];
  for (const r of todayRows) {
    const crossMidnight = r.opens_at > r.closes_at;
    const isOpen = crossMidnight
      ? timeStr >= r.opens_at || timeStr <= r.closes_at
      : timeStr >= r.opens_at && timeStr <= r.closes_at;
    if (isOpen) open.set(r.venue_id, { closesAt: r.closes_at.slice(0, 5) });
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
