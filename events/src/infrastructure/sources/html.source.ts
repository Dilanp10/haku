import * as cheerio from "cheerio";
import type { EventSourcePort } from "../../application/ports/event-source.port.js";
import type { RawEvent } from "../../domain/event.js";

/** Configuración de un scraper HTML, almacenada en event_sources.config (JSONB). */
export interface HtmlSourceConfig {
  key: string;
  url: string;
  userAgent: string;
  /** Selector CSS para cada ítem del listado de eventos. */
  wrapper: string;
  titleSelector: string;
  /** Selector del elemento que contiene la fecha. */
  dateSelector: string;
  /** Atributo del que leer la fecha (ej. "datetime"). Si falta, usa el texto del nodo. */
  dateAttr?: string;
  /**
   * "ISO" — el valor es ya ISO 8601 (se pasa directo).
   * "AR" — formato "DD/MM/YYYY [HH:mm]" (horario de Catamarca, UTC-3).
   * Por defecto "ISO".
   */
  dateFormat?: "ISO" | "AR";
  descSelector?: string;
  linkSelector?: string;
  venueSelector?: string;
  addressSelector?: string;
  imageSelector?: string;
  /** Atributo de la imagen (default: "src"). */
  imageAttr?: string;
  /** Prefijo para URLs relativas (ej. "https://catamarca.gob.ar"). */
  baseUrl?: string;
}

/** Parsea "DD/MM/YYYY[ HH:mm]" en zona Catamarca (UTC-3) → ISO UTC. */
function parseArDate(text: string): string | null {
  const clean = text.trim().replace(/\s+/g, " ");
  // Acepta "DD/MM/YYYY" o "DD/MM/YYYY HH:mm"
  const m = clean.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})(?:\s+(\d{1,2}):(\d{2}))?/);
  if (!m) return null;
  const [, d, mo, y, h = "00", min = "00"] = m;
  // UTC-3 → add 3h para obtener UTC
  const utc = new Date(`${y}-${mo!.padStart(2, "0")}-${d!.padStart(2, "0")}T${h.padStart(2, "0")}:${min}:00+00:00`);
  utc.setHours(utc.getHours() + 3);
  if (isNaN(utc.getTime())) return null;
  return utc.toISOString();
}

function resolveUrl(href: string | undefined, base: string | undefined): string | undefined {
  if (!href) return undefined;
  if (href.startsWith("http")) return href;
  if (base) return `${base.replace(/\/$/, "")}/${href.replace(/^\//, "")}`;
  return href;
}

/**
 * Scraper HTML configurable por selectores CSS.
 * La config proviene del campo `config` JSONB de `event_sources`.
 */
export function createHtmlSource(config: HtmlSourceConfig): EventSourcePort {
  return {
    key: config.key,
    async fetch(_now: Date): Promise<RawEvent[]> {
      const res = await fetch(config.url, {
        headers: { "user-agent": config.userAgent },
      });
      if (!res.ok) throw new Error(`Fuente ${config.key}: HTTP ${res.status}`);
      const html = await res.text();
      const $ = cheerio.load(html);
      const events: RawEvent[] = [];

      $(config.wrapper).each((_i, el) => {
        const wrap = $(el);

        const title = wrap.find(config.titleSelector).first().text().trim();
        if (!title) return; // sin título, saltar

        const dateEl = wrap.find(config.dateSelector).first();
        const dateRaw = config.dateAttr
          ? (dateEl.attr(config.dateAttr) ?? dateEl.text())
          : dateEl.text();

        let startsAt: string | null = null;
        const fmt = config.dateFormat ?? "ISO";
        if (fmt === "AR") {
          startsAt = parseArDate(dateRaw);
        } else {
          const d = new Date(dateRaw.trim());
          if (!isNaN(d.getTime())) startsAt = d.toISOString();
        }
        if (!startsAt) return; // sin fecha válida, saltar

        const description = config.descSelector
          ? wrap.find(config.descSelector).first().text().trim() || undefined
          : undefined;

        const rawLink = config.linkSelector
          ? wrap.find(config.linkSelector).first().attr("href")
          : undefined;
        const url = resolveUrl(rawLink, config.baseUrl);

        const venueName = config.venueSelector
          ? wrap.find(config.venueSelector).first().text().trim() || undefined
          : undefined;

        const address = config.addressSelector
          ? wrap.find(config.addressSelector).first().text().trim() || undefined
          : undefined;

        const imgAttr = config.imageAttr ?? "src";
        const rawImg = config.imageSelector
          ? wrap.find(config.imageSelector).first().attr(imgAttr)
          : undefined;
        const imageUrl = resolveUrl(rawImg, config.baseUrl);

        events.push({
          sourceKey: config.key,
          title,
          startsAt,
          ...(description ? { description } : {}),
          ...(url ? { url } : {}),
          ...(venueName ? { venueName } : {}),
          ...(address ? { address } : {}),
          ...(imageUrl ? { imageUrl } : {}),
        });
      });

      return events;
    },
  };
}

// Re-exportar el tipo legacy para que el barrel no rompa.
export type { HtmlSourceConfig as HtmlSourceLegacyConfig };
