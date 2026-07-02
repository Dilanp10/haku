# Tasks — Búsqueda unificada (`/buscar`)

> Derivado de `plan.md`. Feature nueva — todas pendientes hasta implementar.

## Tareas
- [x] T1 [B] — `buscar/page.tsx`: cuando hay `q`, llamar `getVenueStatuses(supabase)` junto a
  las búsquedas de lugares y eventos.
- [x] T2 [B] — Renderizar lugares con `<VenueCard>` (categoría, barrio, openNow/closesAt/closed)
  y eventos con `<EventCard>`; quitar el markup `<li>` ad-hoc y los imports sin uso.
- [x] T3 [B] — Conservar header, `SearchInput`, conteo, empty-state y links "Ver todos".
- [x] T4 [B] — `pnpm -r typecheck` + build + deploy.

## Verificación final (definition of done)
- [x] AC1 — Lugares con `<VenueCard>`.
- [x] AC2 — Eventos con `<EventCard>`.
- [x] AC3 — Estado abierto/cerrado en los lugares.
- [x] AC4 — Buscador, conteo, empty-state y links conservados.
- [x] AC5 — `pnpm -r typecheck` pasa.
- [x] AC6 — Consistencia visual con `/lugares` (mismas cards).
