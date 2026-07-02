import type { GeoPoint, PriceRange, Pagination } from "@haku/shared";
import type { Category, FoodType, Venue } from "../../domain/venue";

export interface Paginated<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}

export interface ListVenuesQuery {
  categorySlug?: string;
  categorySlugs?: string[];
  foodTypeSlug?: string;
  foodTypeSlugs?: string[];
  priceRange?: PriceRange;
  priceRanges?: PriceRange[];
  search?: string;
  status?: "draft" | "published" | "archived";
  openNow?: boolean;
  attributes?: string[];
  pagination: Pagination;
}

export interface CreateVenueData {
  slug: string;
  name: string;
  description?: string | undefined;
  categorySlug: string;
  address?: string | undefined;
  location?: GeoPoint | undefined;
  priceRange?: PriceRange | undefined;
  phone?: string | undefined;
  website?: string | undefined;
  instagram?: string | undefined;
  coverImageUrl?: string | undefined;
  attributes?: Record<string, unknown> | undefined;
  foodTypeIds?: string[] | undefined;
  status: "draft" | "published" | "archived";
}

/**
 * Patch parcial de edición.
 * - `undefined` = no cambia ese campo.
 * - `null` (en los nullable) = limpiar el valor.
 * - `slug` NO se incluye intencionalmente: las URLs son estables (ver spec 005, N1).
 */
export interface UpdateVenueData {
  name?: string;
  description?: string | null;
  categorySlug?: string;
  address?: string | null;
  location?: GeoPoint | null;
  priceRange?: PriceRange | null;
  phone?: string | null;
  website?: string | null;
  instagram?: string | null;
  coverImageUrl?: string | null;
  foodTypeIds?: string[];
  status?: "draft" | "published" | "archived";
}

/** Puerto de persistencia del módulo Core. Lo implementa la infraestructura (Supabase). */
export interface CoreRepository {
  listVenues(query: ListVenuesQuery): Promise<Paginated<Venue>>;
  getVenueBySlug(slug: string): Promise<Venue | null>;
  searchVenuesNearby(point: GeoPoint, radiusKm: number, limit: number): Promise<Venue[]>;
  listCategories(): Promise<Category[]>;
  listFoodTypes(): Promise<FoodType[]>;
  createVenue(data: CreateVenueData): Promise<Venue>;
  updateVenue(id: string, data: UpdateVenueData): Promise<Venue>;
  incrementViewCount(slug: string): Promise<void>;
}
