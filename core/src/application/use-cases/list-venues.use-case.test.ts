import { describe, it, expect } from "vitest";
import { listVenues } from "./list-venues.use-case.js";
import type { CoreRepository, Paginated } from "../ports/core-repository.port.js";
import type { Venue } from "../../domain/venue.js";

const emptyPage: Paginated<Venue> = { items: [], total: 0, page: 1, pageSize: 20 };

/** Fake del port: demuestra que el use-case se testea sin Supabase ni red. */
const fakeRepo = (over: Partial<CoreRepository> = {}): CoreRepository => ({
  listVenues: async () => emptyPage,
  getVenueBySlug: async () => null,
  searchVenuesNearby: async () => [],
  listCategories: async () => [],
  listFoodTypes: async () => [],
  createVenue: async () => {
    throw new Error("not used");
  },
  updateVenue: async () => {
    throw new Error("not used");
  },
  incrementViewCount: async () => {},
  ...over,
});

describe("listVenues", () => {
  it("rechaza entrada inválida con ValidationError", async () => {
    const r = await listVenues(fakeRepo(), { priceRange: "$$$$" as never });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error.code).toBe("VALIDATION");
  });

  it("aplica paginación por defecto y delega en el repo", async () => {
    const r = await listVenues(fakeRepo(), {});
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.value.pageSize).toBe(20);
  });
});
