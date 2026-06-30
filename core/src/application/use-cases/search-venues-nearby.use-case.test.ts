import { describe, it, expect } from "vitest";
import { searchVenuesNearby } from "./search-venues-nearby.use-case.js";
import type { CoreRepository } from "../ports/core-repository.port.js";
import type { Venue } from "../../domain/venue.js";

const sample: Venue = {
  id: "00000000-0000-0000-0000-000000000020",
  slug: "cafe-x",
  name: "Café X",
  description: null,
  categoryId: "cat-1",
  address: null,
  location: { lat: -28.47, lng: -65.78 },
  phone: null,
  website: null,
  instagram: null,
  priceRange: null,
  coverImageUrl: null,
  foodTypeIds: [],
  status: "published",
  viewCount: 0,
  createdAt: "2026-01-01T00:00:00Z",
  updatedAt: "2026-01-01T00:00:00Z",
};

const fakeRepo = (over: Partial<CoreRepository> = {}): CoreRepository => ({
  listVenues: async () => ({ items: [], total: 0, page: 1, pageSize: 20 }),
  getVenueBySlug: async () => null,
  searchVenuesNearby: async () => [sample],
  listCategories: async () => [],
  listFoodTypes: async () => [],
  createVenue: async () => sample,
  updateVenue: async () => sample,
  incrementViewCount: async () => {},
  ...over,
});

describe("searchVenuesNearby", () => {
  it("rechaza latitud fuera de rango", async () => {
    const r = await searchVenuesNearby(fakeRepo(), {
      point: { lat: 200, lng: 0 },
      radiusKm: 5,
    });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error.code).toBe("VALIDATION");
  });

  it("rechaza radio negativo", async () => {
    const r = await searchVenuesNearby(fakeRepo(), {
      point: { lat: -28.47, lng: -65.78 },
      radiusKm: -1,
    });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error.code).toBe("VALIDATION");
  });

  it("propaga la lista del repo en el caso feliz", async () => {
    const r = await searchVenuesNearby(fakeRepo(), {
      point: { lat: -28.47, lng: -65.78 },
      radiusKm: 5,
    });
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.value).toHaveLength(1);
  });
});
