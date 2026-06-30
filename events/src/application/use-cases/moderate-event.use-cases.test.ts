import { describe, it, expect } from "vitest";
import { NotFoundError } from "@haku/shared";
import { publishEvent, rejectEvent } from "./moderate-event.use-cases.js";
import type { EventRepository } from "../ports/event-repository.port.js";
import type { Event } from "../../domain/event.js";

const sampleEvent: Event = {
  id: "11111111-1111-1111-1111-111111111111",
  sourceKey: "demo",
  slug: "feria-poncho-xxxxxx",
  title: "Feria del Poncho",
  startsAt: "2026-07-19T16:00:00Z",
  status: "published",
  dedupeHash: "abcdef",
  ingestedAt: "2026-06-01T00:00:00Z",
};

const repo = (over: Partial<EventRepository> = {}): EventRepository => ({
  upsertMany: async () => ({ inserted: 0, updated: 0 }),
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

describe("publishEvent / rejectEvent", () => {
  it("rechaza id no-UUID con ValidationError", async () => {
    const r = await publishEvent(repo(), { id: "not-a-uuid" });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error.code).toBe("VALIDATION");
  });

  it("publica un evento existente", async () => {
    const r = await publishEvent(repo(), { id: sampleEvent.id });
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.value.status).toBe("published");
  });

  it("rechaza un evento existente", async () => {
    const r = await rejectEvent(repo(), { id: sampleEvent.id });
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.value.status).toBe("rejected");
  });

  it("propaga NotFoundError", async () => {
    const r = await publishEvent(
      repo({
        updateStatus: async () => {
          throw new NotFoundError("not found");
        },
      }),
      { id: sampleEvent.id },
    );
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error.code).toBe("NOT_FOUND");
  });
});
