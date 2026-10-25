import type { SupabaseClient } from "@supabase/supabase-js";
import { NotFoundError, type Database, type EventStatus, type GeoPoint, type Tables } from "@haku/shared";
import type {
  EventRepository,
  ListUpcomingQuery,
  UpdateEventData,
} from "../application/ports/event-repository.port";
import type { Event } from "../domain/event";

type HakuSupabaseClient = SupabaseClient<Database, "public", any, any, any>;
type EventRow = Tables<"events">;

/** Mapeo fila DB → dominio Event (snake_case → camelCase + lat/lng → location). */
function rowToEvent(row: EventRow): Event {
  return {
    id: row.id,
    sourceKey: row.source_key,
    ...(row.external_id !== null ? { externalId: row.external_id } : {}),
    slug: row.slug,
    title: row.title,
    ...(row.description !== null ? { description: row.description } : {}),
    startsAt: row.starts_at,
    ...(row.ends_at !== null ? { endsAt: row.ends_at } : {}),
    ...(row.venue_name !== null ? { venueName: row.venue_name } : {}),
    ...(row.address !== null ? { address: row.address } : {}),
    ...(row.lat !== null && row.lng !== null ? { location: { lat: row.lat, lng: row.lng } } : {}),
    ...(row.url !== null ? { url: row.url } : {}),
    ...(row.image_url !== null ? { imageUrl: row.image_url } : {}),
    ...(row.category !== null ? { category: row.category } : {}),
    status: row.status,
    dedupeHash: row.dedupe_hash,
    extraSources: Array.isArray(row.extra_sources) ? row.extra_sources : [],
    ingestedAt: row.ingested_at,
  };
}

/** Mapeo dominio (sin id/ingestedAt) → Insert. */
function toInsert(e: Omit<Event, "id" | "ingestedAt">) {
  return {
    source_key: e.sourceKey,
    external_id: e.externalId ?? null,
    slug: e.slug,
    title: e.title,
    description: e.description ?? null,
    starts_at: e.startsAt,
    ends_at: e.endsAt ?? null,
    venue_name: e.venueName ?? null,
    address: e.address ?? null,
    lat: e.location?.lat ?? null,
    lng: e.location?.lng ?? null,
    url: e.url ?? null,
    image_url: e.imageUrl ?? null,
    category: e.category ?? null,
    status: e.status,
    dedupe_hash: e.dedupeHash,
    extra_sources: e.extraSources ?? [],
  };
}

export function createSupabaseEventRepository(
  client: HakuSupabaseClient,
): EventRepository {
  return {
    async upsertMany(events) {
      if (events.length === 0) return { inserted: 0, updated: 0, merged: 0 };

      // Trae los existentes completos para poder mergear sin pisar campos ya cargados.
      const hashes = events.map((e) => e.dedupeHash);
      const preRes = await client
        .from("events")
        .select("*")
        .in("dedupe_hash", hashes);
      if (preRes.error) throw preRes.error;
      const existingByHash = new Map<string, EventRow>();
      for (const row of (preRes.data as EventRow[] | null) ?? []) {
        existingByHash.set(row.dedupe_hash, row);
      }

      const toCreate: ReturnType<typeof toInsert>[] = [];
      const updates: { id: string; patch: Partial<ReturnType<typeof toInsert>>; mergedSource: boolean }[] = [];

      for (const e of events) {
        const existing = existingByHash.get(e.dedupeHash);
        if (!existing) {
          toCreate.push(toInsert(e));
          continue;
        }
        // Merge: completa campos null del existente con los no-null del nuevo,
        // suma el source_key a extra_sources si es distinto del primario.
        const patch: Record<string, unknown> = {};
        const takeIfMissing = <K extends keyof EventRow>(key: K, incoming: EventRow[K] | undefined) => {
          if (incoming !== null && incoming !== undefined && existing[key] === null) {
            patch[key as string] = incoming;
          }
        };
        const row = toInsert(e);
        takeIfMissing("description", row.description);
        takeIfMissing("ends_at", row.ends_at);
        takeIfMissing("venue_name", row.venue_name);
        takeIfMissing("address", row.address);
        takeIfMissing("lat", row.lat);
        takeIfMissing("lng", row.lng);
        takeIfMissing("url", row.url);
        takeIfMissing("image_url", row.image_url);
        takeIfMissing("category", row.category);

        const existingExtras = Array.isArray(existing.extra_sources) ? existing.extra_sources : [];
        const existingAll = new Set<string>([existing.source_key, ...existingExtras]);
        const mergedSource = !existingAll.has(e.sourceKey);
        if (mergedSource) {
          patch["extra_sources"] = [...existingExtras, e.sourceKey];
        }

        if (Object.keys(patch).length > 0) {
          updates.push({ id: existing.id, patch, mergedSource });
        } else if (mergedSource) {
          // Caso puente: solo cambia extra_sources (ya cubierto arriba).
          updates.push({ id: existing.id, patch: { extra_sources: [...existingExtras, e.sourceKey] }, mergedSource: true });
        }
      }

      let inserted = 0;
      if (toCreate.length > 0) {
        const insRes = await client.from("events").insert(toCreate);
        if (insRes.error) throw insRes.error;
        inserted = toCreate.length;
      }

      let updated = 0;
      let merged = 0;
      for (const u of updates) {
        const upd = await client.from("events").update(u.patch).eq("id", u.id);
        if (upd.error) throw upd.error;
        updated++;
        if (u.mergedSource) merged++;
      }

      return { inserted, updated, merged };
    },

    async listUpcoming(q: ListUpcomingQuery): Promise<Event[]> {
      const now = q.from ? new Date(q.from) : new Date();
      // Margen de gracia: un evento sigue visible hasta 24h después de su
      // starts_at (los scrapers casi nunca traen ends_at, y si no fuera por
      // esto los eventos "de hoy" desaparecerían al minuto de empezar).
      const graceIso = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();
      const nowIso = now.toISOString();
      let query = client
        .from("events")
        .select("*")
        .eq("status", "published")
        .or(`starts_at.gte.${graceIso},ends_at.gte.${nowIso}`)
        .order("starts_at", { ascending: true })
        .limit(q.limit);
      if (q.category) query = query.eq("category", q.category);
      if (q.search) query = query.ilike("title", `%${q.search}%`);

      const res = await query;
      if (res.error) throw res.error;
      const rows = (res.data ?? []) as unknown as EventRow[];
      return rows.map(rowToEvent);
    },

    async listEventCategories(): Promise<string[]> {
      const now = new Date();
      const graceIso = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();
      const nowIso = now.toISOString();
      const res = await client
        .from("events")
        .select("category")
        .eq("status", "published")
        .not("category", "is", null)
        .or(`starts_at.gte.${graceIso},ends_at.gte.${nowIso}`);
      if (res.error) throw res.error;
      const rows = (res.data ?? []) as { category: string | null }[];
      const seen = new Set<string>();
      for (const r of rows) if (r.category) seen.add(r.category);
      return [...seen].sort();
    },

    async getBySlug(slug: string): Promise<Event | null> {
      const res = await client.from("events").select("*").eq("slug", slug).maybeSingle();
      if (res.error) throw res.error;
      return res.data ? rowToEvent(res.data as unknown as EventRow) : null;
    },

    async listAll(status: EventStatus | null, limit: number, includePast = false): Promise<Event[]> {
      let query = client
        .from("events")
        .select("*")
        .order("starts_at", { ascending: false })
        .limit(limit);
      if (status !== null) query = query.eq("status", status);
      if (!includePast) query = query.gte("starts_at", new Date().toISOString());
      const res = await query;
      if (res.error) throw res.error;
      const rows = (res.data ?? []) as unknown as EventRow[];
      return rows.map(rowToEvent);
    },

    async listPending(limit: number): Promise<Event[]> {
      const res = await client
        .from("events")
        .select("*")
        .eq("status", "pending")
        .order("ingested_at", { ascending: false })
        .limit(limit);
      if (res.error) throw res.error;
      const rows = (res.data ?? []) as unknown as EventRow[];
      return rows.map(rowToEvent);
    },

    async update(id: string, data: UpdateEventData): Promise<Event> {
      const patch: Record<string, unknown> = {};
      if (data.title !== undefined) patch.title = data.title;
      if (data.description !== undefined) patch.description = data.description;
      if (data.startsAt !== undefined) patch.starts_at = data.startsAt;
      if (data.endsAt !== undefined) patch.ends_at = data.endsAt;
      if (data.venueName !== undefined) patch.venue_name = data.venueName;
      if (data.address !== undefined) patch.address = data.address;
      if (data.url !== undefined) patch.url = data.url;
      if (data.category !== undefined) patch.category = data.category;
      if (data.status !== undefined) patch.status = data.status;
      const res = await client
        .from("events")
        .update(patch)
        .eq("id", id)
        .select("*")
        .maybeSingle();
      if (res.error) throw res.error;
      if (!res.data) throw new NotFoundError(`Evento ${id} no encontrado`);
      return rowToEvent(res.data as unknown as EventRow);
    },

    async updateStatus(id: string, status: EventStatus): Promise<Event> {
      const res = await client
        .from("events")
        .update({ status })
        .eq("id", id)
        .select("*")
        .maybeSingle();
      if (res.error) throw res.error;
      if (!res.data) throw new NotFoundError(`Evento ${id} no encontrado`);
      return rowToEvent(res.data as unknown as EventRow);
    },

    async listNearby(point: GeoPoint, radiusKm: number, limit: number): Promise<Event[]> {
      // Sin PostGIS: prefiltro bounding-box + refinamiento haversine en app.
      const dLat = radiusKm / 111;
      const dLng = radiusKm / (111 * Math.cos((point.lat * Math.PI) / 180) || 1);
      const haversine = (a: GeoPoint, b: GeoPoint): number => {
        const R = 6371;
        const dLatR = ((b.lat - a.lat) * Math.PI) / 180;
        const dLngR = ((b.lng - a.lng) * Math.PI) / 180;
        const s =
          Math.sin(dLatR / 2) ** 2 +
          Math.cos((a.lat * Math.PI) / 180) *
            Math.cos((b.lat * Math.PI) / 180) *
            Math.sin(dLngR / 2) ** 2;
        return R * 2 * Math.atan2(Math.sqrt(s), Math.sqrt(1 - s));
      };

      const res = await client
        .from("events")
        .select("*")
        .eq("status", "published")
        .gte("starts_at", new Date().toISOString())
        .gte("lat", point.lat - dLat)
        .lte("lat", point.lat + dLat)
        .gte("lng", point.lng - dLng)
        .lte("lng", point.lng + dLng)
        .limit(limit * 4);
      if (res.error) throw res.error;

      const rows = (res.data ?? []) as unknown as EventRow[];
      return rows
        .map(rowToEvent)
        .filter((e) => e.location && haversine(point, e.location) <= radiusKm)
        .sort((a, b) => haversine(point, a.location!) - haversine(point, b.location!))
        .slice(0, limit);
    },
  };
}
