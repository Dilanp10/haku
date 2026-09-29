# Tasks — Venue View Count Analytics

> Lista accionable derivada de `plan.md`. Cada tarea: pequeña, testeable, con un
> "hecho" sin ambigüedad. Marcar `[x]` al completar.

## Convenciones
- `T1`, `T2`, ... — orden recomendado.
- `[P]` tarea paralelizable.
- `[B]` bloqueante para otras.

## Tareas

### Bloque 1 — Core + Shared (secuencial, bloquea al Bloque 2)

- [x] T1 [B] — Crear `supabase/migrations/0007_venue_view_count.sql`.
- [x] T2 [B] — Actualizar `shared/src/types/database.ts`: `view_count` en venues.Row e Insert.
- [x] T3 [B] — Agregar `viewCount: number` a la interfaz `Venue`.
- [x] T4 [B] — Agregar `incrementViewCount` al port `CoreRepository`.
- [x] T5 [B] — Implementar `incrementViewCount` en adapter + `viewCount` en `rowToVenue`.
- [x] T6 [B] — Actualizar 4 fakes en tests de `@haku/core` + `viewCount: 0` en sampleVenue.

### Bloque 2 — Web (paralelos entre sí, dependen de Bloque 1)

- [x] T7 [P] — Crear `web/app/api/venues/[slug]/view/route.ts`.
- [x] T8 [P] — Crear `web/components/view-counter.tsx`.
- [x] T9 [P] — Página pública `/lugares/[slug]`: agregar `<ViewCounter slug={slug} />`.
- [x] T10 [P] — Admin detalle `[slug]/page.tsx`: InfoCard "Visitas" en sidebar.
- [x] T11 [P] — Admin lista `lugares/page.tsx`: conteo de visitas junto al slug.

## Verificación final (definition of done)
- [x] `pnpm -r typecheck` pasa sin errores.
- [x] `pnpm -r test` pasa sin errores (16 core + 13 events).
- [x] AC6 — typecheck verde.
- [x] AC7 — tests verde, los 4 fakes de core actualizados.
- [x] `BACKLOG.md` actualizado con la Fase 25.
