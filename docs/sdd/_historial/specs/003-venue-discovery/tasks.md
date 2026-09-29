# Tasks — Venue Discovery

## Tareas
- [x] T1 — `shared/types/database.ts` sincronizado con las 3 migraciones.
- [x] T2 — Use-cases: `getVenueBySlug`, `searchVenuesNearby`, `listCategories`, `listFoodTypes`.
- [x] T3 — Adapter Supabase de `listVenues` con filtros y paginación.
- [x] T4 — Adapter de `getVenueBySlug` + join `venue_food_types`.
- [x] T5 — Adapter de `searchVenuesNearby` (bounding box + haversine).
- [x] T6 — Adapter de `listCategories` / `listFoodTypes`.
- [x] T7 — Test de `distanceKm` (3 casos).
- [x] T8 — Componentes `VenueCard`, `CategoryPills`, `VenueMap`.
- [x] T9 — Página `/lugares` (RSC + ISR + filtros + paginación).
- [x] T10 — Página `/lugares/[slug]` (RSC + ISR + mapa).
- [x] T11 — Home con CTA a `/lugares`.
- [x] T12 — Seed: 3 venues `published` + sus food_types.

## Definition of done
- [x] Typecheck + tests verdes (5/5 packages, 5 tests core + 2 events).
- [x] `BACKLOG.md` Fase 1 ✅.
