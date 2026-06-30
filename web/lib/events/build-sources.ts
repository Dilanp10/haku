import {
  createHtmlSource,
  createICalSource,
  createDemoSource,
  DEMO_SOURCE_KEY,
  type EventSourcePort,
} from "@haku/events";

export interface SourceRow {
  key: string;
  url: string;
  type: "html" | "ical" | "api";
  active: boolean;
  config: Record<string, unknown> | null;
}

/**
 * Construye los `EventSourcePort` a partir de filas de `event_sources`.
 * Solo procesa filas con `active=true`. El key "demo-catamarca" usa
 * `createDemoSource()` en vez de un scraper HTTP.
 */
export function buildSources(rows: SourceRow[], userAgent: string): EventSourcePort[] {
  return rows
    .filter((r) => r.active)
    .map((r) => {
      if (r.key === DEMO_SOURCE_KEY) return createDemoSource();
      if (r.type === "html") {
        return createHtmlSource({
          key: r.key,
          url: r.url,
          userAgent,
          wrapper: "article",
          titleSelector: "h2",
          dateSelector: "time",
          ...(r.config ?? {}),
        });
      }
      if (r.type === "ical") {
        return createICalSource({ key: r.key, url: r.url, userAgent });
      }
      return null;
    })
    .filter((s): s is EventSourcePort => s !== null);
}
