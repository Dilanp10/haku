# Tasks — M03: core (lugares)

Fuente: SDD.md (Approved). Cada task histórica apunta a su feature en `../_historial/specs/`.

## TASK-001 — Descubrimiento público (listado, filtros, detalle con mapa)
Status: COMPLETED
Satisfies: FR-001, FR-002
Fuente: 003-venue-discovery

Descripción:
Use-cases `listVenues`, `getVenueBySlug`, catálogos; adapter Supabase; listado ISR y detalle con Leaflet.

## TASK-002 — Edición y archivado de venues (admin)
Status: COMPLETED
Satisfies: FR-004
Fuente: 005-venue-editing

Descripción:
`updateVenue` + form de edición y listado admin con todos los estados.

## TASK-003 — Lugares cerca mío
Status: COMPLETED
Satisfies: FR-003
Fuente: 006-lugares-cerca-mio

Descripción:
`searchVenuesNearby` y página `/lugares/cerca` ordenada por distancia.

## TASK-004 — Preview admin del detalle de venue
Status: COMPLETED
Satisfies: FR-005
Fuente: 012-admin-venue-detail-preview

Descripción:
Ruta `/admin/lugares/[slug]` con barra de acciones.

## TASK-005 — Contador de vistas
Status: COMPLETED
Satisfies: FR-009
Fuente: 013-venue-view-count-analytics

Descripción:
RPC de Supabase y `POST /api/venues/[slug]/view`.

## TASK-006 — Favoritos
Status: COMPLETED
Satisfies: FR-007
Fuente: 014-venue-favorites

Descripción:
Tabla `venue_saves` con RLS, toggle optimista y `/perfil/favoritos`.

## TASK-007 — Ratings
Status: COMPLETED
Satisfies: FR-008
Fuente: 015-venue-ratings

Descripción:
Tabla `venue_ratings`, estrellas, promedio público y métrica admin.

## TASK-008 — Horarios de apertura
Status: COMPLETED
Satisfies: FR-006
Fuente: 016-venue-opening-hours

Descripción:
Tabla `venue_hours`, form admin, tabla pública y badge "Abierto ahora".

## TASK-009 — Alta de venue desde el admin
Status: COMPLETED
Satisfies: FR-004
Fuente: 017-admin-create-venue

Descripción:
`/admin/lugares/nuevo` con slug automático, cover opcional y errores de slug duplicado.

## TASK-010 — Descubrimiento avanzado (filtros múltiples, abierto ahora)
Status: COMPLETED
Satisfies: FR-001, FR-006
Fuente: 023-descubrimiento-avanzado

Descripción:
Migración `attributes`/`neighborhood`, filtros múltiples y sin recarga, geolocalización inline.

Completed:
- Backfill. T3, T4 y T8 figuraban como pendientes en el historial, pero al migrar se verificó que `openStateAt` existe con tests y que `supabase-core.repository.ts` y `web/lib/venue-open-now.ts` ya lo usan.

## TASK-011 — Wizard "Sugerir un lugar"
Status: COMPLETED
Satisfies: FR-010
Fuente: 024-sugerir-lugar-wizard

Descripción:
Wizard mobile-first de 7 pasos con audio y horarios.

## TASK-012 — Revisión admin de sugerencias + geocoding
Status: COMPLETED
Satisfies: FR-010
Fuente: 025-admin-sugerencias-geocoding

Descripción:
Materializar horarios sugeridos y geocodificar por dirección.

## TASK-013 — Búsqueda unificada
Status: COMPLETED
Satisfies: FR-011
Fuente: 026-buscar-unificado

Descripción:
`/buscar` con `VenueCard`/`EventCard` compartidas.

## TASK-014 — Verificación manual de favoritos, ratings, horarios y alta
Status: PENDING
Satisfies: FR-005, FR-006, FR-007, FR-008

Descripción:
Ejecutar las AC que quedaron sin marcar en las features 014 (AC1–AC4, AC9), 015 (AC1–AC5, AC7), 016 (AC1–AC6) y 017 (AC1–AC7); correr `pnpm -r typecheck` y `pnpm -r test`.

## TASK-015 — Integración del adapter: cierre de checks
Status: PENDING
Satisfies: NFR-005

Descripción:
Correr `pnpm --filter @haku/core test:integration` con `supabase start` y confirmar AC1–AC6 de la feature 010 (los tests ya existen).

## TASK-016 — Consolidar `CATEGORY_EMOJI` duplicado
Status: PENDING
Satisfies: NFR-002

Descripción:
Unificar el mapa duplicado en `web/app/admin/lugares/page.tsx` y `web/app/admin/lugares/sugerencias/page.tsx` en `category-visuals.ts`.

## TASK-017 — Migrar imágenes de venues del proyecto viejo
Status: PENDING
Satisfies: FR-004

Descripción:
Copiar las imágenes del storage del proyecto viejo (`sanpcejzzmytsefaamzx`, morficata) al proyecto Supabase actual y actualizar `cover_image_url`.
