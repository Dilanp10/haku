# SDD — M03: core (lugares)

## 1. Identificación
Module: M03
Name: core — descubrimiento de lugares (`@haku/core`)
Status: Approved   <!-- aprobado por el usuario el 2026-09-29 (migración desde spec-kit) -->

## 2. Objetivo
Modelar y servir el catálogo descubrible de Catamarca: venues clasificados por categoría y
food types, con búsqueda por cercanía, filtros, horarios, favoritos, puntajes y flujo de
sugerencias, más la administración de venues.

## 3. Alcance
Incluye:
- Venues, categorías, food types (N–N), atributos/servicios y barrio.
- Lectura pública filtrada, cercanía (haversine) y estado "abierto ahora" (`openStateAt`).
- Administración: crear, editar, archivar, preview de detalle, revisión de sugerencias y geocoding.
- Sugerencias públicas (wizard) que entran como `draft`, favoritos, ratings 1–5, contador de vistas.

No incluye:
- Sesión y permisos (M02): `web` resuelve el rol antes de mutar.
- Eventos (M04). Sin dependencia con M04.
- Cliente Supabase ni tablas crudas hacia afuera.

## 4. Requisitos funcionales
FR-001 — Listar venues publicados con filtros múltiples (categorías, food types, precios, atributos, `openNow`, búsqueda) y paginación.
FR-002 — Obtener venue por slug (`NotFoundError` si no existe) y listar categorías y food types.
FR-003 — Buscar venues cerca de un punto (`searchVenuesNearby`) ordenados por distancia.
FR-004 — Crear (`createVenue`) y editar/archivar (`updateVenue`) venues desde el admin, con slug único y cover image opcional.
FR-005 — Preview admin del detalle público con acciones (editar, cambio de status).
FR-006 — Horarios por día (múltiples rangos, cruce de medianoche) y estado abierto/cerrado calculado por la función pura `openStateAt`; el adapter y `web/lib/venue-open-now.ts` deben delegar en ella.
FR-007 — Favoritos: usuario autenticado guarda/quita venues (optimistic UI) y ve `/perfil/favoritos`.
FR-008 — Ratings: usuario autenticado puntúa 1–5 (upsert); se muestra promedio y total; admin ve la métrica.
FR-009 — Contador de vistas por venue vía RPC.
FR-010 — Sugerir lugar (wizard de 7 pasos, con audio y horarios) y revisión admin que materializa horarios y geocodifica.
FR-011 — Búsqueda unificada `/buscar` con cards compartidas `VenueCard`/`EventCard`.

## 5. Requisitos no funcionales
NFR-001 — Depende solo de M01; sin imports de `auth` ni `events`.
NFR-002 — Dominio puro (`domain/`, `use-cases/`): IO por ports; validación Zod en use-cases; devuelven `Result`.
NFR-003 — RLS: `anon` solo ve `status='published'`; escritura solo admin/service_role, excepto sugerencias y favoritos/ratings propios.
NFR-004 — Lectura pública con RSC + ISR; mutaciones con Server Actions que revalidan.
NFR-005 — Tests de use-cases con fakes y suite de integración del adapter contra Supabase local.

## 6. Arquitectura del módulo
`core/src/{domain,application/{ports,use-cases},infrastructure}` + `index.ts`.
Ports: `CoreRepository`, `CreateVenueData`. Adapter: `createSupabaseCoreRepository(client)`.
Use-cases: `listVenues`, `getVenueBySlug`, `searchVenuesNearby`, `listCategories`,
`listFoodTypes`, `createVenue`, `updateVenue`. Dominio: `venue.ts`, `opening-hours.ts`.

## 7. Flujo de datos
Lectura: Usuario → web (RSC/ISR) → `@haku/core.listVenues` → Supabase (RLS pública).
Mutación: Admin → Server Action → `@haku/auth.requireRole('admin')` → `@haku/core.createVenue/updateVenue` → Supabase → `revalidatePath`.

## 8. Modelo de datos
`categories`, `food_types`, `venues` (+`attributes jsonb`, `neighborhood`, `view_count`, `cover_image_url`, `status`), `venue_food_types`, `venue_hours` (varios rangos por día), `venue_saves`, `venue_ratings`.

## 9. API
Rutas HTTP: `POST /api/venues/[slug]/view` (incrementa vistas). El resto se expone como use-cases consumidos por RSC y Server Actions.

## 10. Seguridad
RLS por tabla (migraciones 0002, 0005–0010). Favoritos y ratings: cada usuario solo ve/escribe lo suyo. Rating validado 1–5 en la Server Action. Sugerencias públicas entran como `draft`.

## 11. Dependencias
M01 (shared). Consumido por M05 (web). Migraciones en M06.

## 12. Criterios de aceptación
- Todos los FR verificados; `pnpm typecheck`, `pnpm test` y `pnpm --filter @haku/core test:integration` pasan.
- `openStateAt` es la única implementación del cálculo abierto/cerrado.
- Verificaciones manuales de favoritos, ratings, horarios y alta de venue completadas (ver TASKS.md).
