# Tasks — Eventos Cerca Tuyo (008)

> Plan: [plan.md](./plan.md)

## DoD general
- `pnpm lint && pnpm -r typecheck && pnpm -r test` ✅ tras cada tarea.
- Sin imports `@haku/core` dentro de `events/`.

---

- [x] T1 — `events/` port: agregar `listNearby` a `EventRepository`.
- [x] T2 — `events/` use-case: `search-events-nearby.use-case.ts`.
- [x] T3 — `events/` test: `search-events-nearby.use-case.test.ts` (3 casos).
- [x] T4 — `events/` adapter: implementar `listNearby` en `supabase-event.repository.ts`.
- [x] T5 — `events/` barrel: exportar `searchEventsNearby` + tipo desde `index.ts`.
- [x] T6 — `supabase/` migración: `0004_events_geo_index.sql`.
- [x] T7 — `web/` página: `app/eventos/cerca/page.tsx`.
- [x] T8 — `web/` CTA: agregar "Cerca tuyo" en `app/eventos/page.tsx`.
- [x] T9 — `BACKLOG.md`: marcar 008 ✅ + agregar a Fase 7.
