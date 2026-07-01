// API pública de @haku/core. Otros módulos solo importan desde aquí.

// Dominio
export type { Venue, Category, FoodType } from "./domain/venue";
export { distanceKm } from "./domain/venue";

// Contratos de aplicación
export type {
  CoreRepository,
  CreateVenueData,
  ListVenuesQuery,
  Paginated,
  UpdateVenueData,
} from "./application/ports/core-repository.port";

// Casos de uso
export { listVenues, type ListVenuesInput } from "./application/use-cases/list-venues.use-case";
export { getVenueBySlug } from "./application/use-cases/get-venue-by-slug.use-case";
export {
  searchVenuesNearby,
  type SearchVenuesNearbyInput,
} from "./application/use-cases/search-venues-nearby.use-case";
export {
  listCategories,
  listFoodTypes,
} from "./application/use-cases/list-catalog.use-cases";
export {
  createVenue,
  type CreateVenueInput,
} from "./application/use-cases/create-venue.use-case";
export {
  updateVenue,
  type UpdateVenueInput,
} from "./application/use-cases/update-venue.use-case";

// Infraestructura
export { createSupabaseCoreRepository } from "./infrastructure/supabase-core.repository";
