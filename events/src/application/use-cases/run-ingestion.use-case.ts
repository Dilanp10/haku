import { normalize, type Event } from "../../domain/event.js";
import type { EventSourcePort } from "../ports/event-source.port.js";
import type { EventRepository } from "../ports/event-repository.port.js";

export interface IngestionDeps {
  sources: EventSourcePort[];
  repo: EventRepository;
  clock?: () => Date;
}

export interface IngestionSummary {
  fetched: number;
  inserted: number;
  updated: number;
  skipped: number;
  errors: { sourceKey: string; message: string }[];
}

/**
 * Corre la ingesta de una o todas las fuentes. Resiliente: el fallo de una fuente
 * no aborta las demás (se acumula en `errors`). Todo entra como `pending`.
 */
export async function runIngestion(
  deps: IngestionDeps,
  sourceKey?: string,
): Promise<IngestionSummary> {
  const now = (deps.clock ?? (() => new Date()))();
  const sources = sourceKey ? deps.sources.filter((s) => s.key === sourceKey) : deps.sources;
  const summary: IngestionSummary = { fetched: 0, inserted: 0, updated: 0, skipped: 0, errors: [] };

  for (const source of sources) {
    try {
      const raw = await source.fetch(now);
      summary.fetched += raw.length;

      // normaliza + dedupe dentro del lote por dedupeHash
      const seen = new Set<string>();
      const batch: Omit<Event, "id" | "ingestedAt">[] = [];
      for (const r of raw) {
        const normalized = normalize(r);
        if (seen.has(normalized.dedupeHash)) {
          summary.skipped++;
          continue;
        }
        seen.add(normalized.dedupeHash);
        batch.push(normalized);
      }

      const res = await deps.repo.upsertMany(batch);
      summary.inserted += res.inserted;
      summary.updated += res.updated;
    } catch (e) {
      summary.errors.push({
        sourceKey: source.key,
        message: e instanceof Error ? e.message : String(e),
      });
    }
  }

  return summary;
}
