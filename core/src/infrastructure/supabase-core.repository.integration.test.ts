import { createClient } from "@supabase/supabase-js";
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { createSupabaseCoreRepository } from "./supabase-core.repository";

const SUPABASE_URL = process.env.SUPABASE_URL ?? "http://127.0.0.1:54321";
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";

if (!SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error(
    "SUPABASE_SERVICE_ROLE_KEY no definida. Crear .env.test.local con las credenciales de `supabase start`.",
  );
}

const client = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
const repo = createSupabaseCoreRepository(client);

/** Elimina todos los venues de test y sus food_types asociados. */
async function cleanupTestVenues() {
  const { data } = await client
    .from("venues")
    .select("id")
    .like("slug", "__test__%");
  const ids = (data ?? []).map((r: { id: string }) => r.id);
  if (ids.length > 0) {
    await client.from("venue_food_types").delete().in("venue_id", ids);
    await client.from("venues").delete().in("id", ids);
  }
}

afterAll(async () => {
  await cleanupTestVenues();
});

// ─── listVenues ───────────────────────────────────────────────────────────────

describe("listVenues", () => {
  let catSlug: string;

  beforeAll(async () => {
    const cats = await repo.listCategories();
    catSlug = cats[0]!.slug;
    await client.from("venues").insert([
      { slug: "__test__-list-pub", name: "Test Pub", category_id: cats[0]!.id, status: "published" },
      { slug: "__test__-list-draft", name: "Test Draft", category_id: cats[0]!.id, status: "draft" },
    ]);
    void catSlug;
  });

  it("retorna venues published", async () => {
    // Nota: el test corre con service_role (bypassa RLS). El use-case delega el
    // filtro público a la RLS (ver SPEC §3, §NFR-003), por eso acá solo se
    // verifica que el venue publicado aparezca — no que todos lo sean.
    const result = await repo.listVenues({ pagination: { page: 1, pageSize: 50 } });
    const slugs = result.items.map((v) => v.slug);
    expect(slugs).toContain("__test__-list-pub");
    const pub = result.items.find((v) => v.slug === "__test__-list-pub");
    expect(pub?.status).toBe("published");
  });

  it("filtra por status draft", async () => {
    const result = await repo.listVenues({ status: "draft", pagination: { page: 1, pageSize: 50 } });
    const slugs = result.items.map((v) => v.slug);
    expect(slugs).toContain("__test__-list-draft");
    expect(result.items.every((v) => v.status === "draft")).toBe(true);
  });
});

// ─── getVenueBySlug ───────────────────────────────────────────────────────────

describe("getVenueBySlug", () => {
  let catId: string;

  beforeAll(async () => {
    const cats = await repo.listCategories();
    catId = cats[0]!.id;
    await client.from("venues").insert({
      slug: "__test__-get-slug",
      name: "Test GetSlug",
      category_id: catId,
      status: "published",
    });
  });

  it("retorna el venue cuando el slug existe", async () => {
    const venue = await repo.getVenueBySlug("__test__-get-slug");
    expect(venue).not.toBeNull();
    expect(venue?.slug).toBe("__test__-get-slug");
    expect(venue?.name).toBe("Test GetSlug");
  });

  it("retorna null cuando el slug no existe", async () => {
    const venue = await repo.getVenueBySlug("__test__-no-existe-xyz");
    expect(venue).toBeNull();
  });
});

// ─── createVenue ─────────────────────────────────────────────────────────────

describe("createVenue", () => {
  it("inserta el venue y retorna el objeto con id", async () => {
    const cats = await repo.listCategories();
    const venue = await repo.createVenue({
      slug: "__test__-create",
      name: "Test Create",
      categorySlug: cats[0]!.slug,
      status: "draft",
    });
    expect(venue.id).toBeDefined();
    expect(venue.slug).toBe("__test__-create");
    // Verificar que la fila existe en DB.
    const { data } = await client.from("venues").select("id").eq("slug", "__test__-create").maybeSingle();
    expect(data).not.toBeNull();
  });
});

// ─── updateVenue ─────────────────────────────────────────────────────────────

describe("updateVenue", () => {
  let venueId: string;

  beforeAll(async () => {
    const cats = await repo.listCategories();
    const { data } = await client
      .from("venues")
      .insert({ slug: "__test__-update", name: "Test Update Original", category_id: cats[0]!.id, status: "draft" })
      .select("id")
      .single();
    venueId = (data as { id: string }).id;
  });

  it("actualiza solo el campo name", async () => {
    const updated = await repo.updateVenue(venueId, { name: "__test__-updated" });
    expect(updated.name).toBe("__test__-updated");
    expect(updated.slug).toBe("__test__-update");
  });
});

// ─── listCategories ───────────────────────────────────────────────────────────

describe("listCategories", () => {
  it("retorna un array no vacío con la forma correcta", async () => {
    const cats = await repo.listCategories();
    expect(cats.length).toBeGreaterThan(0);
    for (const c of cats) {
      expect(c.id).toBeDefined();
      expect(c.slug).toBeDefined();
      expect(c.name).toBeDefined();
    }
  });
});

// ─── listFoodTypes ────────────────────────────────────────────────────────────

describe("listFoodTypes", () => {
  it("retorna un array no vacío con la forma correcta", async () => {
    const fts = await repo.listFoodTypes();
    expect(fts.length).toBeGreaterThan(0);
    for (const ft of fts) {
      expect(ft.id).toBeDefined();
      expect(ft.slug).toBeDefined();
      expect(ft.name).toBeDefined();
    }
  });
});

// ─── searchVenuesNearby ───────────────────────────────────────────────────────

describe("searchVenuesNearby", () => {
  const CENTER = { lat: -28.4696, lng: -65.7795 }; // Catamarca capital

  beforeAll(async () => {
    const cats = await repo.listCategories();
    await client.from("venues").insert([
      {
        slug: "__test__-nearby-close",
        name: "Test Nearby Close",
        category_id: cats[0]!.id,
        status: "published",
        lat: -28.4700,
        lng: -65.7800,
      },
      {
        slug: "__test__-nearby-far",
        name: "Test Nearby Far",
        category_id: cats[0]!.id,
        status: "published",
        lat: -31.0, // ~280 km al sur
        lng: -65.7795,
      },
    ]);
  });

  it("retorna venues dentro del radio y excluye los lejanos", async () => {
    const results = await repo.searchVenuesNearby(CENTER, 5, 20);
    const slugs = results.map((v) => v.slug);
    expect(slugs).toContain("__test__-nearby-close");
    expect(slugs).not.toContain("__test__-nearby-far");
  });
});
