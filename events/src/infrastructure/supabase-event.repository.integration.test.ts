import { createClient } from "@supabase/supabase-js";
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { createSupabaseEventRepository } from "./supabase-event.repository.js";
import type { Event } from "../domain/event.js";

const SUPABASE_URL = process.env.SUPABASE_URL ?? "http://127.0.0.1:54321";
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";

if (!SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error(
    "SUPABASE_SERVICE_ROLE_KEY no definida. Crear .env.test.local con las credenciales de `supabase start`.",
  );
}

const client = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
const repo = createSupabaseEventRepository(client);

type NewEvent = Omit<Event, "id" | "ingestedAt">;

const FUTURE = new Date(Date.now() + 60 * 60 * 1000).toISOString();
const PAST = new Date(Date.now() - 60 * 60 * 1000).toISOString();
const CENTER = { lat: -28.4696, lng: -65.7795 };

function makeEvent(overrides: Partial<NewEvent> & { slug: string }): NewEvent {
  const { slug, title, startsAt, status, dedupeHash, ...rest } = overrides;
  return {
    sourceKey: "demo",
    slug,
    title: title ?? "Test Event",
    startsAt: startsAt ?? FUTURE,
    status: status ?? "published",
    dedupeHash: dedupeHash ?? `__test__-${slug}-${Date.now()}`,
    ...rest,
  };
}

async function cleanupTestEvents() {
  await client.from("events").delete().like("slug", "__test__%");
}

afterAll(async () => {
  await cleanupTestEvents();
});

// ─── upsertMany ───────────────────────────────────────────────────────────────

describe("upsertMany", () => {
  const hash = `__test__-upsert-${Date.now()}`;

  it("inserta un evento nuevo (inserted=1)", async () => {
    const result = await repo.upsertMany([
      makeEvent({ slug: "__test__-upsert", dedupeHash: hash }),
    ]);
    expect(result.inserted).toBe(1);
    expect(result.updated).toBe(0);
  });

  it("detecta duplicado por dedupe_hash (inserted=0, updated=1)", async () => {
    const result = await repo.upsertMany([
      makeEvent({ slug: "__test__-upsert", dedupeHash: hash }),
    ]);
    expect(result.inserted).toBe(0);
    expect(result.updated).toBe(1);
  });
});

// ─── listUpcoming ─────────────────────────────────────────────────────────────

describe("listUpcoming", () => {
  beforeAll(async () => {
    await repo.upsertMany([
      makeEvent({ slug: "__test__-upcoming-fut", startsAt: FUTURE, status: "published", dedupeHash: `__test__-upcoming-fut-${Date.now()}` }),
      makeEvent({ slug: "__test__-upcoming-past", startsAt: PAST, status: "published", dedupeHash: `__test__-upcoming-past-${Date.now()}` }),
    ]);
  });

  it("retorna solo eventos futuros published", async () => {
    const events = await repo.listUpcoming({ limit: 100 });
    const slugs = events.map((e) => e.slug);
    expect(slugs).toContain("__test__-upcoming-fut");
    expect(slugs).not.toContain("__test__-upcoming-past");
  });
});

// ─── getBySlug ────────────────────────────────────────────────────────────────

describe("getBySlug", () => {
  beforeAll(async () => {
    await repo.upsertMany([
      makeEvent({ slug: "__test__-get-slug-ev", dedupeHash: `__test__-get-slug-ev-${Date.now()}` }),
    ]);
  });

  it("retorna el evento cuando el slug existe", async () => {
    const event = await repo.getBySlug("__test__-get-slug-ev");
    expect(event).not.toBeNull();
    expect(event?.slug).toBe("__test__-get-slug-ev");
  });

  it("retorna null cuando el slug no existe", async () => {
    const event = await repo.getBySlug("__test__-no-existe-xyz");
    expect(event).toBeNull();
  });
});

// ─── listPending ─────────────────────────────────────────────────────────────

describe("listPending", () => {
  beforeAll(async () => {
    await repo.upsertMany([
      makeEvent({ slug: "__test__-pending-a", status: "pending", dedupeHash: `__test__-pending-a-${Date.now()}` }),
      makeEvent({ slug: "__test__-pending-pub", status: "published", dedupeHash: `__test__-pending-pub-${Date.now()}` }),
    ]);
  });

  it("retorna solo eventos pending", async () => {
    const events = await repo.listPending(100);
    const slugs = events.map((e) => e.slug);
    expect(slugs).toContain("__test__-pending-a");
    expect(slugs).not.toContain("__test__-pending-pub");
    expect(events.every((e) => e.status === "pending")).toBe(true);
  });
});

// ─── updateStatus ─────────────────────────────────────────────────────────────

describe("updateStatus", () => {
  let eventId: string;

  beforeAll(async () => {
    await repo.upsertMany([
      makeEvent({ slug: "__test__-status-change", status: "pending", dedupeHash: `__test__-status-change-${Date.now()}` }),
    ]);
    const ev = await repo.getBySlug("__test__-status-change");
    eventId = ev!.id;
  });

  it("cambia el status del evento", async () => {
    const updated = await repo.updateStatus(eventId, "published");
    expect(updated.status).toBe("published");
  });
});

// ─── listAll ─────────────────────────────────────────────────────────────────

describe("listAll", () => {
  beforeAll(async () => {
    await repo.upsertMany([
      makeEvent({ slug: "__test__-all-pub", status: "published", dedupeHash: `__test__-all-pub-${Date.now()}` }),
      makeEvent({ slug: "__test__-all-pend", status: "pending", dedupeHash: `__test__-all-pend-${Date.now()}` }),
    ]);
  });

  it("listAll(null) retorna todos los estados", async () => {
    const events = await repo.listAll(null, 200);
    const slugs = events.map((e) => e.slug);
    expect(slugs).toContain("__test__-all-pub");
    expect(slugs).toContain("__test__-all-pend");
  });

  it("listAll('published') filtra solo publicados", async () => {
    const events = await repo.listAll("published", 200);
    const slugs = events.map((e) => e.slug);
    expect(slugs).toContain("__test__-all-pub");
    expect(events.every((e) => e.status === "published")).toBe(true);
  });
});

// ─── listNearby ──────────────────────────────────────────────────────────────

describe("listNearby", () => {
  beforeAll(async () => {
    await repo.upsertMany([
      makeEvent({
        slug: "__test__-nearby-ev-close",
        status: "published",
        startsAt: FUTURE,
        dedupeHash: `__test__-nearby-ev-close-${Date.now()}`,
        location: { lat: -28.470, lng: -65.780 },
      }),
      makeEvent({
        slug: "__test__-nearby-ev-far",
        status: "published",
        startsAt: FUTURE,
        dedupeHash: `__test__-nearby-ev-far-${Date.now()}`,
        location: { lat: -31.0, lng: -65.7795 },
      }),
    ]);
  });

  it("retorna eventos dentro del radio y excluye los lejanos", async () => {
    const events = await repo.listNearby(CENTER, 5, 20);
    const slugs = events.map((e) => e.slug);
    expect(slugs).toContain("__test__-nearby-ev-close");
    expect(slugs).not.toContain("__test__-nearby-ev-far");
  });
});

// ─── update ──────────────────────────────────────────────────────────────────

describe("update", () => {
  let eventId: string;

  beforeAll(async () => {
    await repo.upsertMany([
      makeEvent({ slug: "__test__-update-ev", title: "Original Title", dedupeHash: `__test__-update-ev-${Date.now()}` }),
    ]);
    const ev = await repo.getBySlug("__test__-update-ev");
    eventId = ev!.id;
  });

  it("actualiza solo el campo title", async () => {
    const updated = await repo.update(eventId, { title: "__test__-titulo-nuevo" });
    expect(updated.title).toBe("__test__-titulo-nuevo");
    expect(updated.slug).toBe("__test__-update-ev");
  });
});
