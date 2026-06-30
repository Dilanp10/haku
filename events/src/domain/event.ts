import type { GeoPoint, EventStatus } from "@haku/shared";

/** Lo que devuelve un scraper, sin normalizar ni persistir. */
export interface RawEvent {
  sourceKey: string;
  externalId?: string;
  title: string;
  description?: string;
  startsAt: string; // ISO
  endsAt?: string;
  venueName?: string;
  address?: string;
  location?: GeoPoint;
  url?: string;
  imageUrl?: string;
  category?: string;
}

/** Evento normalizado y persistido. */
export interface Event extends RawEvent {
  id: string;
  slug: string;
  status: EventStatus;
  dedupeHash: string;
  ingestedAt: string;
}

const toSlug = (s: string): string =>
  s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 120);

/** Hash estable para deduplicar el mismo evento entre corridas (djb2, sin deps). */
export function dedupeHash(raw: Pick<RawEvent, "sourceKey" | "title" | "startsAt">): string {
  const input = `${raw.sourceKey}|${raw.title.trim().toLowerCase()}|${raw.startsAt}`;
  let h = 5381;
  for (let i = 0; i < input.length; i++) h = ((h << 5) + h + input.charCodeAt(i)) | 0;
  return (h >>> 0).toString(16);
}

/** Normaliza un RawEvent a los campos persistibles (pura). */
export function normalize(raw: RawEvent): Omit<Event, "id" | "ingestedAt"> {
  const title = raw.title.trim();
  const hash = dedupeHash(raw);
  return {
    ...raw,
    title,
    slug: `${toSlug(title)}-${hash.slice(0, 6)}`,
    status: "pending",
    dedupeHash: hash,
  };
}
