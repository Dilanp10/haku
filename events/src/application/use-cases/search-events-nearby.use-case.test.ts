import { describe, it, expect } from "vitest";
import { searchEventsNearby } from "./search-events-nearby.use-case";
import type { EventRepository } from "../ports/event-repository.port";
import type { Event } from "../../domain/event";

const sampleEvent = (overrides: Partial<Event> = {}): Event => ({
  id: "11111111-1111-1111-1111-111111111111",
  sourceKey: "demo",
  slug: "festival-de-la-musica-abc123",
  title: "Festival de la Música",
  startsAt: "2026-08-15T20:00:00Z",
  status: "published",
  dedupeHash: "abc123",
  ingestedAt: "2026-06-01T00:00:00Z",
  location: { lat: -28.4696, lng: -65.7852 },
  ...overrides,
});

const repo = (over: Partial<EventRepository> = {}): EventRepository => ({
  upsertMany: async () => ({ inserted: 0, updated: 0 }),
  listUpcoming: async () => [],
  listAll: async () => [],
  getBySlug: async () => null,
  listPending: async () => [],
  update: async (id) => sampleEvent({ id }),
  updateStatus: async (_id, status) => sampleEvent({ status }),
  listNearby: async () => [],
  listEventCategories: async () => [],
  ...over,
});

describe("searchEventsNearby", () => {
  it("devuelve eventos cuando el repositorio los encuentra", async () => {
    const events = [sampleEvent(), sampleEvent({ id: "22222222-2222-2222-2222-222222222222", slug: "peña-folclorica-def456" })];
    const r = await searchEventsNearby(
      repo({ listNearby: async () => events }),
      { point: { lat: -28.47, lng: -65.79 } },
    );
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.value).toHaveLength(2);
  });

  it("devuelve ValidationError con coordenadas fuera de rango", async () => {
    const r = await searchEventsNearby(repo(), { point: { lat: 999, lng: -65.79 } });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error.code).toBe("VALIDATION");
  });

  it("devuelve array vacío cuando no hay eventos en el radio", async () => {
    const r = await searchEventsNearby(
      repo({ listNearby: async () => [] }),
      { point: { lat: -28.47, lng: -65.79 } },
    );
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.value).toHaveLength(0);
  });
});
