# Plan — Venue Discovery

## 1. Arquitectura afectada
- `@haku/core`: 5 use-cases (list, byId, nearby, categories, foodTypes) + adapter.
- `@haku/web`: `/lugares` y `/lugares/[slug]` + componentes (`VenueCard`,
  `CategoryPills`, `VenueMap`).
- `shared`: hand-typed `Database` sincronizado con migraciones.

## 2. Modelo de datos
Ya existe (`venues`, `categories`, `food_types`, `venue_food_types` desde 0002).
Sin migración nueva.

## 3. Ports y use-cases
```ts
interface CoreRepository {
  listVenues(query): Promise<Paginated<Venue>>
  getVenueBySlug(slug): Promise<Venue | null>
  searchVenuesNearby(point, radiusKm, limit): Promise<Venue[]>
  listCategories(): Promise<Category[]>
  listFoodTypes(): Promise<FoodType[]>
}
listVenues(repo, input): Result<Paginated<Venue>>
getVenueBySlug(repo, { slug }): Result<Venue>  // NotFound si no existe
searchVenuesNearby(repo, { point, radiusKm, limit }): Result<Venue[]>
```

## 4. Infraestructura (Supabase)
- `listVenues`: `select('*, categories!inner(slug)')` con joins condicionales por
  food-type (resolución previa de `id`), `ilike` para búsqueda, `count: 'exact'`.
- `getVenueBySlug`: `select('*, venue_food_types(food_type_id)').maybeSingle()`.
- `searchVenuesNearby`: bounding box en SQL + haversine + sort en app.
- `listCategories` / `listFoodTypes`: trivial.

## 5. UI / Server Actions
- `/lugares` (RSC, `revalidate=300`): consume `listVenues` + `listCategories`.
  Paginación con `?page`. Filtros con `?categoria`/`?precio`/`?q`.
- `/lugares/[slug]` (RSC, `revalidate=600`): consume `getVenueBySlug` + catálogos.
  `notFound()` si `NOT_FOUND`. Mapa Leaflet client-only.

## 6. Tests
- Unit: `list-venues.use-case.test.ts` (validación + paginación default).
- Unit: `distanceKm` (haversine simétrica + ~111 km/grado).

## 7. Riesgos
- supabase-js inferring `never` en joins → resuelto con assertion `as unknown as VenueRow[]`
  en el adapter (boundary).

## 8. Orden
1. `shared/database.ts` hand-typed.
2. Use-cases + tests.
3. Adapter Supabase.
4. Index público de `@haku/core`.
5. Componentes web.
6. Pages `/lugares` + `/lugares/[slug]`.
7. Home con CTA.
8. Seed de 3 venues de muestra.
