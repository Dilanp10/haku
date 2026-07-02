import type { ContentStatus, PriceRange, GeoPoint } from "@haku/shared";

export interface Category {
  id: string;
  slug: string;
  name: string;
  icon?: string;
}

export interface FoodType {
  id: string;
  slug: string;
  name: string;
}

export interface Venue {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  categoryId: string;
  address: string | null;
  location: GeoPoint | null;
  phone?: string | null;
  website?: string | null;
  instagram?: string | null;
  priceRange?: PriceRange | null;
  coverImageUrl?: string | null;
  neighborhood?: string | null;
  foodTypeIds: string[];
  attributes?: Record<string, boolean>;
  status: ContentStatus;
  viewCount: number;
  createdAt: string;
  updatedAt: string;
}

/** Distancia haversine en km entre dos puntos (lógica de dominio pura). */
export function distanceKm(a: GeoPoint, b: GeoPoint): number {
  const R = 6371;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

const toRad = (deg: number): number => (deg * Math.PI) / 180;
