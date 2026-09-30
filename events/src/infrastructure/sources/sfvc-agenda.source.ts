import type { EventSourcePort } from "../../application/ports/event-source.port";
import type { RawEvent } from "../../domain/event";

/**
 * Fuente real: agenda pública de la Municipalidad de San Fernando del Valle de
 * Catamarca (`sfvc.tur.ar`). El sitio expone su búsqueda a través de un
 * Meilisearch público con una API key de solo lectura embebida en el frontend.
 * No hay OAuth ni rate-limit hostil: son los mismos parámetros que la propia
 * web usa para renderizar `/agenda`.
 *
 * Config en `event_sources.config` (JSONB):
 * {
 *   "adapter": "sfvc-agenda",   // discriminador para buildSources
 *   "host": "https://buscar.apps.sfvc.tur.ar",
 *   "meiliKey": "…",             // la key pública que aparece en el HTML
 *   "indexUid": "idx_agenda",
 *   "urlPrefix": "https://sfvc.tur.ar",
 *   "limit": 100
 * }
 */
export interface SfvcAgendaSourceConfig {
  key: string;
  host: string;
  meiliKey: string;
  indexUid: string;
  /** Prefijo para URLs relativas de la agenda (`/actividades/…`). */
  urlPrefix?: string;
  /** Máximo de resultados a pedir en una corrida (default 100). */
  limit?: number;
  userAgent: string;
}

interface Hit {
  id?: string | number;
  original_id?: string;
  slug?: string;
  titulo?: string;
  descripcion?: string;
  timestamp?: number;
  date?: string;
  hora?: string;
  lugar?: string;
  url?: string;
  imagen?: string;
  tematicas?: string[];
  tipo?: string;
  datos_completos?: {
    direccion?: string | null;
    coordenadas_de_ubicacion?: unknown;
  };
}

interface SearchResponse {
  hits?: Hit[];
  message?: string;
}

/** Parsea `"lat,lng"`, `[lat,lng]` o `{lat,lng}` a un GeoPoint válido. */
function parseCoordinates(raw: unknown): { lat: number; lng: number } | undefined {
  if (!raw) return undefined;
  if (typeof raw === "string") {
    const m = raw.replace(/\s+/g, "").split(",");
    if (m.length !== 2) return undefined;
    const [lat, lng] = m.map(Number);
    if (Number.isFinite(lat) && Number.isFinite(lng)) return { lat: lat!, lng: lng! };
    return undefined;
  }
  if (Array.isArray(raw) && raw.length === 2) {
    const [lat, lng] = raw.map(Number);
    if (Number.isFinite(lat) && Number.isFinite(lng)) return { lat: lat!, lng: lng! };
  }
  if (typeof raw === "object" && raw !== null) {
    const o = raw as { lat?: number; lng?: number; latitude?: number; longitude?: number };
    const lat = o.lat ?? o.latitude;
    const lng = o.lng ?? o.longitude;
    if (Number.isFinite(lat) && Number.isFinite(lng)) return { lat: lat!, lng: lng! };
  }
  return undefined;
}

/** Combina `date` (YYYY-MM-DD) + `hora` (HH:mm[:ss]) en UTC-3 → ISO UTC. */
function combineDateHora(date: string, hora: string | undefined): string | null {
  const h = (hora ?? "00:00:00").padEnd(8, ":00").slice(0, 8);
  const iso = `${date}T${h}-03:00`;
  const t = Date.parse(iso);
  return Number.isFinite(t) ? new Date(t).toISOString() : null;
}

function resolveUrl(url: string | undefined, prefix: string | undefined): string | undefined {
  if (!url) return undefined;
  if (/^https?:\/\//.test(url)) return url;
  if (!prefix) return url;
  return `${prefix.replace(/\/$/, "")}/${url.replace(/^\//, "")}`;
}

/** Mapea un hit del Meilisearch a un `RawEvent`. Devuelve null si le faltan campos obligatorios. */
export function mapSfvcHit(hit: Hit, sourceKey: string, urlPrefix?: string): RawEvent | null {
  const title = hit.titulo?.trim();
  if (!title) return null;

  let startsAt: string | null = null;
  if (typeof hit.timestamp === "number" && Number.isFinite(hit.timestamp)) {
    startsAt = new Date(hit.timestamp).toISOString();
  } else if (hit.date) {
    startsAt = combineDateHora(hit.date, hit.hora);
  }
  if (!startsAt) return null;

  const coords = parseCoordinates(hit.datos_completos?.coordenadas_de_ubicacion);
  const externalId = hit.original_id ?? hit.slug ?? (hit.id != null ? String(hit.id) : undefined);

  const raw: RawEvent = {
    sourceKey,
    title,
    startsAt,
  };
  if (externalId) raw.externalId = externalId;
  if (hit.descripcion?.trim()) raw.description = hit.descripcion.trim();
  if (hit.lugar?.trim()) raw.venueName = hit.lugar.trim();
  const dir = hit.datos_completos?.direccion?.trim();
  if (dir) raw.address = dir;
  if (coords) raw.location = coords;
  const url = resolveUrl(hit.url, urlPrefix);
  if (url) raw.url = url;
  if (hit.imagen) raw.imageUrl = hit.imagen;
  const category = hit.tematicas?.[0] ?? hit.tipo;
  if (category) raw.category = category;

  return raw;
}

/**
 * Scraper de la agenda de SFVC (Meilisearch público). Trae los eventos ordenados
 * por `timestamp` ascendente y los mapea a `RawEvent`. Si algún hit no tiene
 * título o fecha se descarta silenciosamente; el fallo de red se propaga y
 * `runIngestion` lo captura como error de la fuente sin abortar las demás.
 */
export function createSfvcAgendaSource(config: SfvcAgendaSourceConfig): EventSourcePort {
  const limit = config.limit ?? 100;
  return {
    key: config.key,
    async fetch(_now: Date): Promise<RawEvent[]> {
      const res = await fetch(`${config.host.replace(/\/$/, "")}/indexes/${config.indexUid}/search`, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          authorization: `Bearer ${config.meiliKey}`,
          "user-agent": config.userAgent,
        },
        body: JSON.stringify({ q: "", sort: ["timestamp:asc"], limit }),
      });
      if (!res.ok) {
        throw new Error(`Fuente ${config.key}: HTTP ${res.status}`);
      }
      const body = (await res.json()) as SearchResponse;
      if (body.message) {
        throw new Error(`Fuente ${config.key}: Meilisearch respondió "${body.message}"`);
      }
      const hits = body.hits ?? [];
      const events: RawEvent[] = [];
      for (const hit of hits) {
        const mapped = mapSfvcHit(hit, config.key, config.urlPrefix);
        if (mapped) events.push(mapped);
      }
      return events;
    },
  };
}
