// API pública de @haku/core. Otros módulos solo importan desde aquí.

// Dominio
export type { Venue, Category, FoodType } from "./domain/venue.js";
export { distanceKm } from "./domain/venue.js";

// Contratos de aplicación
export type {
  CoreRepository,
  CreateVenueData,
  ListVenuesQuery,
  Paginated,
  UpdateVenueData,
} from "./application/ports/core-repository.port.js";

// Casos de uso
export { listVenues, type ListVenuesInput } from "./application/use-cases/list-venues.use-case.js";
export { getVenueBySlug } from "./application/use-cases/get-venue-by-slug.use-case.js";
export {
  searchVenuesNearby,
  type SearchVenuesNearbyInput,
} from "./application/use-cases/search-venues-nearby.use-case.js";
export {
  listCategories,
  listFoodTypes,
} from "./application/use-cases/list-catalog.use-cases.js";
export {
  createVenue,
  type CreateVenueInput,
} from "./application/use-cases/create-venue.use-case.js";
export {
  updateVenue,
  type UpdateVenueInput,
} from "./application/use-cases/update-venue.use-case.js";

// Infraestructura
export { createSupabaseCoreRepository } from "./infrastructure/supabase-core.repository.js";
