export const PRICE_RANGES = ["$", "$$", "$$$"] as const;
export type PriceRange = (typeof PRICE_RANGES)[number];

export const CONTENT_STATUS = ["draft", "published", "archived"] as const;
export type ContentStatus = (typeof CONTENT_STATUS)[number];

export const EVENT_STATUS = ["pending", "published", "rejected"] as const;
export type EventStatus = (typeof EVENT_STATUS)[number];

/** Centro por defecto: San Fernando del Valle de Catamarca. */
export const MAP_DEFAULTS = {
  center: { lat: -28.4696, lng: -65.7795 },
  zoom: 13,
} as const;
