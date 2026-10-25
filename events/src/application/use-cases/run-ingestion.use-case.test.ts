import { describe, it, expect } from "vitest";
import { runIngestion } from "./run-ingestion.use-case";
import type { EventSourcePort } from "../ports/event-source.port";
import type { EventRepository } from "../ports/event-repository.port";
import type { RawEvent } from "../../domain/event";

const raw = (over: Partial<RawEvent>): RawEvent => ({
  sourceKey: "s1",
  title: "Feria del libro",
  startsAt: "2026-07-10T18:00:00Z",
  ...over,
});

const repo = (): EventRepository & { received: number; batches: Omit<import("../../domain/event").Event, "id" | "ingestedAt">[][] } => {
  let received = 0;
  const batches: Omit<import("../../domain/event").Event, "id" | "ingestedAt">[][] = [];
  // Simula el merge por dedupeHash: la primera vez inserta, las siguientes mergean.
  const seenHashes = new Map<string, string>(); // hash → sourceKey primario
  return {
    get received() {
      return received;
    },
    get batches() {
      return batches;
    },
    async upsertMany(events) {
      received += events.length;
      batches.push([...events]);
      let inserted = 0;
      let updated = 0;
      let merged = 0;
      for (const e of events) {
        const existing = seenHashes.get(e.dedupeHash);
        if (!existing) {
          seenHashes.set(e.dedupeHash, e.sourceKey);
          inserted++;
        } else {
          updated++;
          if (existing !== e.sourceKey) merged++;
        }
      }
      return { inserted, updated, merged };
    },
    async listUpcoming() {
      return [];
    },
    async getBySlug() {
      return null;
    },
    async listPending() {
      return [];
    },
    async update() {
      throw new Error("not used");
    },
    async updateStatus() {
      throw new Error("not used");
    },
    async listAll() {
      return [];
    },
    async listNearby() {
      return [];
    },
    async listEventCategories() {
      return [];
    },
  };
};

describe("runIngestion", () => {
  it("deduplica dentro del lote por dedupeHash", async () => {
    const r = repo();
    const source: EventSourcePort = {
      key: "s1",
      fetch: async () => [raw({}), raw({}), raw({ title: "Otro" })],
    };
    const summary = await runIngestion({ sources: [source], repo: r });
    expect(summary.fetched).toBe(3);
    expect(summary.skipped).toBe(1);
    expect(r.received).toBe(2);
  });

  it("mergea el mismo evento desde dos fuentes distintas", async () => {
    const r = repo();
    const sfvc: EventSourcePort = {
      key: "sfvc",
      fetch: async () => [raw({ sourceKey: "sfvc", title: "La Beriso", startsAt: "2026-11-10T21:30:00Z" })],
    };
    const entradaweb: EventSourcePort = {
      key: "entradaweb",
      // Mismo título normalizado, misma hora (minutos distintos): hashea igual.
      fetch: async () => [raw({ sourceKey: "entradaweb", title: "LA BERISO", startsAt: "2026-11-10T21:50:00Z" })],
    };
    const summary = await runIngestion({ sources: [sfvc, entradaweb], repo: r });
    expect(summary.fetched).toBe(2);
    expect(summary.inserted).toBe(1);
    expect(summary.updated).toBe(1);
    expect(summary.merged).toBe(1);
    expect(summary.skipped).toBe(0);
  });

  it("el fallo de una fuente no aborta las demás", async () => {
    const r = repo();
    const bad: EventSourcePort = {
      key: "bad",
      fetch: async () => {
        throw new Error("boom");
      },
    };
    const good: EventSourcePort = { key: "good", fetch: async () => [raw({ sourceKey: "good" })] };
    const summary = await runIngestion({ sources: [bad, good], repo: r });
    expect(summary.errors).toHaveLength(1);
    expect(summary.errors[0]?.sourceKey).toBe("bad");
    expect(summary.inserted).toBe(1);
  });
});
