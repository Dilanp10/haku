import { describe, it, expect } from "vitest";
import { ConflictError } from "@haku/shared";
import { createVenue } from "./create-venue.use-case";
import type { CoreRepository } from "../ports/core-repository.port";
import type { Venue } from "../../domain/venue";

const sampleVenue: Venue = {
  id: "00000000-0000-0000-0000-000000000001",
  slug: "cafe-x",
  name: "Café X",
  description: null,
  categoryId: "cat-1",
  address: null,
  location: null,
  phone: null,
  website: null,
  instagram: null,
  priceRange: null,
  coverImageUrl: null,
  foodTypeIds: [],
  status: "draft",
  viewCount: 0,
  createdAt: "2026-01-01T00:00:00Z",
  updatedAt: "2026-01-01T00:00:00Z",
};

const fakeRepo = (over: Partial<CoreRepository> = {}): CoreRepository => ({
  listVenues: async () => ({ items: [], total: 0, page: 1, pageSize: 20 }),
  getVenueBySlug: async () => null,
  searchVenuesNearby: async () => [],
  listCategories: async () => [],
  listFoodTypes: async () => [],
  createVenue: async () => sampleVenue,
  updateVenue: async () => sampleVenue,
  incrementViewCount: async () => {},
  ...over,
});

describe("createVenue", () => {
  it("rechaza slug inválido", async () => {
    const r = await createVenue(fakeRepo(), {
      slug: "Slug Con Espacios",
      name: "X",
      categorySlug: "cafeteria",
    });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error.code).toBe("VALIDATION");
  });

  it("propaga ConflictError del repo (slug duplicado)", async () => {
    const r = await createVenue(
      fakeRepo({
        createVenue: async () => {
          throw new ConflictError("dup");
        },
      }),
      { slug: "cafe-x", name: "Café X", categorySlug: "cafeteria" },
    );
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error.code).toBe("CONFLICT");
  });

  it("crea con valores válidos", async () => {
    const r = await createVenue(fakeRepo(), {
      slug: "cafe-x",
      name: "Café X",
      categorySlug: "cafeteria",
      status: "published",
    });
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.value.slug).toBe("cafe-x");
  });
});
