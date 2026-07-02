# Tasks — Búsqueda unificada (`/buscar`)

> Derivado de `plan.md`. Feature nueva — todas pendientes hasta implementar.

## Tareas
- [ ] T1 [B] — `buscar/page.tsx`: cuando hay `q`, llamar `getVenueStatuses(supabase)` junto a
  las búsquedas de lugares y eventos.
- [ ] T2 [B] — Renderizar lugares con `<VenueCard>` (categoría, barrio, openNow/closesAt/closed)
  y eventos con `<EventCard>`; quitar el markup `<li>` ad-hoc y los imports sin uso.
- [ ] T3 [B] — Conservar header, `SearchInput`, conteo, empty-state y links "Ver todos".
- [ ] T4 [B] — `pnpm -r typecheck` + deploy + verificación visual (`/buscar?q=cafe`).

## Verificación final (definition of done)
- [ ] AC1 — Lugares con `<VenueCard>`.
- [ ] AC2 — Eventos con `<EventCard>`.
- [ ] AC3 — Estado abierto/cerrado en los lugares.
- [ ] AC4 — Buscador, conteo, empty-state y links conservados.
- [ ] AC5 — `pnpm -r typecheck` pasa.
- [ ] AC6 — Consistencia visual con `/lugares` verificada.
