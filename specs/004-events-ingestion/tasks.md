# Tasks — Events Ingestion

## Tareas
- [x] T0 [B] — Decidir fuente concreta (DemoEventSource, ver spec §10).
- [x] T1 — Adapter Supabase: `upsertMany` con pre-check de hashes existentes.
- [x] T2 — Adapter: `listUpcoming` (filtros `status=published` + `starts_at >= now`).
- [x] T3 — Adapter: `getBySlug`.
- [x] T4 — `/api/events/ingest` carga `event_sources` activas y arma `EventSourcePort[]`.
- [x] T5 — Use-cases admin: `publishEvent`, `rejectEvent`, `listPendingEvents`
       + métodos del port (`listPending`, `updateStatus`).
- [x] T6 — Tests unit de `publishEvent` / `rejectEvent` (4 casos).
- [x] T7 — `/eventos` (page RSC + ISR 300s) y `/eventos/[slug]` (ISR 600s).
- [x] T8 — `/admin/eventos` (page + Server Actions `publishEventAction` / `rejectEventAction`).
- [x] T9 — `DemoEventSource` con 6 eventos fijos (dedupe estable).
- [ ] T10 — Índice SQL `(status, starts_at)` — opcional, posponer hasta tener tráfico.
- [x] T11 — Doc del cron en `docs/events-cron.md` + manifiesto `deploy/k8s/events-cron.yaml`.

## Definition of done
- [x] `pnpm -r typecheck` y `pnpm -r test` verdes.
- [x] BACKLOG actualizado.
