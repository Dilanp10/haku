# Tasks — Descubrimiento avanzado

> Lista accionable derivada de `plan.md`. `[x]` = ya shipeado (backfill). `[ ]` = pendiente
> que la spec mandata (deuda de constitución a saldar).

## Convenciones
- `T1`, `T2`, … — orden recomendado. `[P]` paralelizable. `[B]` bloqueante.

## Tareas

### Bloque 1 — Infra + datos
- [x] T1 [B] — Migración: `venues.attributes jsonb`, `venues.neighborhood text`, índice GIN;
  drop `UNIQUE (venue_id, day_of_week)` en `venue_hours` + índice `(venue_id, day_of_week)`.
- [x] T2 [B] — `shared/src/types/database.ts`: agregar `attributes` y `neighborhood` a
  `venues.Row`/`Insert`.

### Bloque 2 — Dominio y contrato core
- [ ] T3 [B] — **PENDIENTE** — `core/src/domain/opening-hours.ts`: función pura `openStateAt`
  (rango simple, cruce de medianoche, múltiples rangos). Export en `index.ts`.
  Hecho cuando `openStateAt` existe y está exportada.
- [ ] T4 [B] — **PENDIENTE** — `core/src/domain/opening-hours.test.ts`: 4 casos mínimos
  (dentro de rango, fuera, cruce medianoche, múltiples rangos, sin rangos).
- [x] T5 [B] — `ListVenuesQuery` + `Venue` (attributes/neighborhood) + `CreateVenueData.coverImageUrl`.
- [x] T6 [B] — `list-venues.use-case.ts`: validación Zod de `categorySlugs`, `foodTypeSlugs`,
  `priceRanges`, `openNow`, `attributes`.
- [x] T7 [B] — `supabase-core.repository.ts`: filtros multi (`.eq`/`.in`), `attributes`
  (`.contains`), `openNow` (resolver ids abiertos), map de `attributes`/`neighborhood`.
- [ ] T8 [B] — **PENDIENTE (refactor III)** — el cómputo open-now del adapter y de
  `web/lib/venue-open-now.ts` deben delegar en `openStateAt` (no reimplementar).

### Bloque 3 — Web
- [x] T9 [P] — `web/lib/venue-open-now.ts`: `getVenueStatuses` (hoy + knownIds).
- [x] T10 [P] — `web/components/venues-filters.tsx`: carrusel + panel, sincroniza URL sin recarga.
- [x] T11 [P] — `web/components/locate-me-inline.tsx`: geolocalización → `?lat&lng`, detecta
  permiso denegado con Permissions API + ayuda para reactivar.
- [x] T12 [P] — `web/components/card-save-button.tsx`: guardar favorito desde la card.
- [x] T13 [P] — `venue-card.tsx` / `event-card.tsx`: estado abierto/cerrado (punto verde/rojo),
  distancia (m/km), barrio.
- [x] T14 [P] — `haku-map.tsx`: pin por estado (verde/rojo/terra) + popup con horario.
- [x] T15 [B] — `page.tsx`, `/lugares/page.tsx`, `/eventos/page.tsx`: parseo de filtros multi,
  orden por cercanía con `?lat&lng`, `force-dynamic`, contador "N abiertos · N total".
- [x] T16 [B] — `/lugares/cerca` y `/eventos/cerca`: redirect a los listados con `?lat&lng`.

## Verificación final (definition of done)
- [ ] T3–T4, T8 completadas (refactor de dominio + tests).
- [ ] `pnpm -r typecheck` pasa.
- [ ] `pnpm -r test` pasa (incluye `opening-hours.test.ts`).
- [x] AC1 — filtros multi (AND entre grupos, OR dentro).
- [x] AC2 — "Abierto ahora" filtra por hora de Catamarca.
- [ ] AC3 — estado calculado por `openStateAt` con tests (pendiente refactor).
- [x] AC4 — orden por cercanía + distancia en cards.
- [x] AC5 — filtros actualizan URL sin recarga ni salto de scroll.
- [x] AC6 — `attributes`/`neighborhood` visibles.
