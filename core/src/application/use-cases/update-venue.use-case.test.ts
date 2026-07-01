import { describe, it, expect } from "vitest";
import { NotFoundError, ConflictError } from "@haku/shared";
import { updateVenue } from "./update-venue.use-case";
import type { CoreRepository } from "../ports/core-repository.port";
import type { Venue } from "../../domain/venue";

const sample: Venue = {
  id: "00000000-0000-0000-0000-000000000010",
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
  createVenue: async () => sample,
  updateVenue: async (id, data) => ({ ...sample, id, ...(data.name ? { name: data.name } : {}) }),
  incrementViewCount: async () => {},
  ...over,
});

describe("updateVenue", () => {
  it("rechaza id no-UUID con ValidationError", async () => {
    const r = await updateVenue(fakeRepo(), { id: "not-uuid", name: "X" });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error.code).toBe("VALIDATION");
  });

  it("rechaza name vacío", async () => {
    const r = await updateVenue(fakeRepo(), { id: sample.id, name: "" });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error.code).toBe("VALIDATION");
  });

  it("propaga NotFoundError del repo", async () => {
    const r = await updateVenue(
      fakeRepo({ updateVenue: async () => { throw new NotFoundError("missing"); } }),
      { id: sample.id, name: "Café Y" },
    );
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error.code).toBe("NOT_FOUND");
  });

  it("propaga ConflictError (categoría inexistente)", async () => {
    const r = await updateVenue(
      fakeRepo({ updateVenue: async () => { throw new ConflictError("no cat"); } }),
      { id: sample.id, categorySlug: "fake" },
    );
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error.code).toBe("CONFLICT");
  });

  it("actualiza el nombre y devuelve el venue", async () => {
    const r = await updateVenue(fakeRepo(), { id: sample.id, name: "Café Y" });
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.value.name).toBe("Café Y");
  });
});
