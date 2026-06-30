import { describe, it, expect } from "vitest";
import { createEvent } from "./create-event.use-case.js";
import type { EventRepository } from "../ports/event-repository.port.js";
import type { Event } from "../../domain/event.js";

const sampleEvent: Event = {
  id: "11111111-1111-1111-1111-111111111111",
  sourceKey: "manual",
  slug: "test-event-abc123",
  title: "Test Event",
  startsAt: "2026-08-01T20:00:00Z",
  status: "published",
  dedupeHash: "abc123",
  ingestedAt: "2026-06-01T00:00:00Z",
};

const repo = (over: Partial<EventRepository> = {}): EventRepository => ({
  upsertMany: async () => ({ inserted: 1, updated: 0 }),
  listUpcoming: async () => [],
  listAll: async () => [],
  getBySlug: async () => null,
  listPending: async () => [],
  update: async (id) => ({ ...sampleEvent, id }),
  updateStatus: async (id, status) => ({ ...sampleEvent, id, status }),
  listNearby: async () => [],
  listEventCategories: async () => [],
  ...over,
});

describe("createEvent", () => {
  it("crea evento y retorna slug", async () => {
    const r = await createEvent(repo(), {
      title: "Feria del Poncho 2026",
      startsAt: "2026-07-19T16:00:00Z",
      category: "cultura",
    });
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.value.slug).toContain("feria-del-poncho-2026");
    }
  });

  it("rechaza titulo vacio con ValidationError", async () => {
    const r = await createEvent(repo(), { title: "", startsAt: "2026-07-19T16:00:00Z" });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error.code).toBe("VALIDATION");
  });

  it("rechaza startsAt vacio con ValidationError", async () => {
    const r = await createEvent(repo(), { title: "Test", startsAt: "" });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error.code).toBe("VALIDATION");
  });

  it("usa status published por defecto", async () => {
    let upserted: unknown[] = [];
    const r = await createEvent(
      repo({ upsertMany: async (events) => { upserted = events; return { inserted: 1, updated: 0 }; } }),
      { title: "Test", startsAt: "2026-08-01T20:00:00Z" },
    );
    expect(r.ok).toBe(true);
    expect((upserted[0] as { status: string }).status).toBe("published");
  });

  it("permite override de status", async () => {
    let upserted: unknown[] = [];
    const r = await createEvent(
      repo({ upsertMany: async (events) => { upserted = events; return { inserted: 1, updated: 0 }; } }),
      { title: "Test", startsAt: "2026-08-01T20:00:00Z", status: "pending" },
    );
    expect(r.ok).toBe(true);
    expect((upserted[0] as { status: string }).status).toBe("pending");
  });
});
