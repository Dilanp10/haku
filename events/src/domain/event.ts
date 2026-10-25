import { createHash } from "node:crypto";
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
  /** source_keys adicionales que publicaron este mismo evento, sin el primario. */
  extraSources: string[];
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

/**
 * Normaliza un título para dedup: sin tildes, en minúsculas, solo alfanumérico y
 * espacios, espacios colapsados. "La Beriso – Show" ≡ "la beriso show".
 */
export function normalizeTitle(title: string): string {
  return title
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9 ]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** Trunca un ISO a la hora exacta (ignora minutos, segundos y ms). Devuelve el epoch en ms. */
export function hourEpoch(iso: string): number {
  const ms = new Date(iso).getTime();
  return Math.floor(ms / 3_600_000) * 3_600_000;
}

/**
 * Hash estable para deduplicar el mismo evento, incluso entre fuentes distintas.
 * md5 porque es idéntico al nativo de Postgres y permite recomputar en SQL.
 */
export function dedupeHash(raw: Pick<RawEvent, "title" | "startsAt">): string {
  const key = `${normalizeTitle(raw.title)}|${hourEpoch(raw.startsAt)}`;
  return createHash("md5").update(key).digest("hex");
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
    extraSources: [],
  };
}
