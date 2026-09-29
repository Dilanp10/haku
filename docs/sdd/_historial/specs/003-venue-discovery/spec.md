# Feature Spec — Venue Discovery

> Estado: **completado** (Fase 1).

## 1. Resumen
Descubrimiento público de lugares de Catamarca: listado con filtros (categoría,
precio, búsqueda) + paginación + detalle con mapa Leaflet/OSM. RSC + ISR.

## 2. Motivación
Es el corazón del producto: la razón por la que la gente entra a Haku. Sin esto,
no hay "vamos".

## 3. Objetivos
- O1 — `/lugares` ISR con filtros y paginación.
- O2 — `/lugares/[slug]` con info + mapa + food types.
- O3 — Use-cases puros (sin Supabase) + adapter Supabase aislado.
- O4 — RLS limita la lectura pública a `status='published'`.

## 4. No-objetivos
- N1 — Mutaciones (cubierto por Fase 2).
- N2 — Búsqueda full-text avanzada (suficiente con `ilike`).
- N3 — Reseñas / ratings (futuro).

## 5. Usuarios y permisos
| Rol     | Puede |
|---------|-------|
| visitor | ver `/lugares` y detalle (solo `published`) |

## 6. Comportamiento esperado
- `/lugares` lista venues `published` ordenados por `updated_at desc`.
- Filtros combinables: `?categoria=cafeteria&precio=$$&q=café`.
- Paginación 12 por página con prev/next.
- `/lugares/[slug]` muestra venue o `notFound()` si no existe / no publicado.
- Búsqueda geográfica disponible via use-case `searchVenuesNearby` (sin UI dedicada
  todavía; expuesta para fase posterior).

## 7. Contratos de módulo
- `@haku/core` API pública:
  - `listVenues`, `getVenueBySlug`, `searchVenuesNearby`, `listCategories`, `listFoodTypes`.
  - `CoreRepository` port + `createSupabaseCoreRepository(client)`.
- Sin nuevas dependencias entre dominios.

## 8. Criterios de aceptación
- AC1 — Visitor anónimo ve solo venues `published`.
- AC2 — Borradores invisibles en `/lugares` (verificado por RLS).
- AC3 — Filtros combinables retornan el subconjunto correcto.
- AC4 — Mapa centra en el venue (o en Catamarca si no tiene coords).
- AC5 — `pnpm -r typecheck` + `pnpm -r test` ✅.

## 9. Riesgos
- Sin PostGIS, búsqueda por cercanía es bounding-box + haversine en app →
  aceptable para escala Catamarca.

## 10. Preguntas abiertas
Ninguna pendiente.
