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

const repo = (): EventRepository & { received: number } => {
  let received = 0;
  return {
    get received() {
      return received;
    },
    async upsertMany(events) {
      received += events.length;
      return { inserted: events.length, updated: 0 };
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
