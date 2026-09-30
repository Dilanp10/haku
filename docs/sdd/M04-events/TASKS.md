# Tasks — M04: events

Fuente: SDD.md (Approved). Cada task histórica apunta a su feature en `../_historial/specs/`.

## TASK-001 — Ingesta, adapter Supabase, moderación y `/eventos`
Status: COMPLETED
Satisfies: FR-001, FR-002, FR-004, FR-005, FR-008
Fuente: 004-events-ingestion

Descripción:
`runIngestion`, `DemoEventSource`, adapter real, `/api/events/ingest`, moderación admin y páginas públicas.

## TASK-002 — Eventos cerca tuyo
Status: COMPLETED
Satisfies: FR-007
Fuente: 008-eventos-cerca-tuyo

Descripción:
`searchEventsNearby` y `/eventos/cerca`.

## TASK-003 — Fuentes HTML e iCal
Status: COMPLETED
Satisfies: FR-003
Fuente: 009-scraper-sources

Descripción:
`HtmlSource` (selectores CSS por config) e `ICalSource`.

## TASK-004 — Tests de integración del adapter
Status: COMPLETED
Satisfies: NFR-005
Fuente: 010-integration-tests-adapter

Descripción:
Config vitest de integración, tests del adapter y job `integration` en CI.

## TASK-005 — Email al admin tras la ingesta
Status: COMPLETED
Satisfies: FR-009
Fuente: 011-admin-email-notificacion-ingesta

Descripción:
Aviso por Resend con link a moderación; degradación segura sin variables.

## TASK-006 — Fuente demo de Catamarca y botón de ingesta
Status: COMPLETED
Satisfies: FR-008
Fuente: 018-fuente-catamarca-real

Descripción:
Fuente `demo-catamarca` en el seed y botón "Disparar ingesta" en el admin.

## TASK-007 — Alta manual de eventos
Status: COMPLETED
Satisfies: FR-006
Fuente: 020-admin-create-event

Descripción:
`/admin/eventos/nuevo`.

## TASK-008 — Smoke test end-to-end de la ingesta
Status: PENDING
Satisfies: FR-008, FR-009

Descripción:
Ejecutar el T4 de la feature 018 y sus AC1–AC6 (ingesta manual → pending → publicar → visible en `/eventos`). Incluye las AC3/AC4 de la 011 (email con clave inválida o sin variables devuelve `200`).

## TASK-009 — Integración del adapter: cierre de checks
Status: COMPLETED
Satisfies: NFR-005

Descripción:
Correr `pnpm --filter @haku/events test:integration` con `supabase start` y confirmar AC1–AC6 de la feature 010.

Completed:
- 2026-09-29: los 11 tests del suite de integración de `events` pasan contra Supabase local.

Files:
- (sin cambios de código; se corrió la suite existente)

Tests:
- `pnpm --filter @haku/events test:integration` (11 tests)

SDD requirements satisfied:
- NFR-005

## TASK-010 — Índice SQL `(status, starts_at)`
Status: COMPLETED
Satisfies: NFR-004

Descripción:
Opcional: agregar el índice cuando haya tráfico que lo justifique (T10 de la feature 004).

Completed:
- 2026-09-29: nueva migración `0012_events_status_starts_at_idx.sql` que crea `events_status_starts_at_idx (status, starts_at)` y borra el `events_status_idx` (redundante como prefijo del compuesto). `EXPLAIN` sobre `listUpcoming` confirma que el planner usa el índice nuevo.

Files:
- supabase/migrations/0012_events_status_starts_at_idx.sql

Tests:
- `pnpm --filter @haku/events test:integration` (11) y `pnpm --filter @haku/core test:integration` (9) en verde tras aplicar la migración.

SDD requirements satisfied:
- NFR-004

## TASK-011 — Scrapers de fuentes reales de Catamarca
Status: COMPLETED
Satisfies: FR-003

Descripción:
Activar una fuente real y ajustar selectores. No bloquea producción.

Completed:
- 2026-09-30: se agregó la fuente real `sfvc-agenda` (Municipalidad de San Fernando del Valle), que consume el Meilisearch público que usa el propio sitio `sfvc.tur.ar/agenda` (bearer key de solo lectura). Es una API estructurada, no scraping HTML, así que no depende de selectores CSS.
- Investigación descartó otras fuentes: `visitcatamarca.com` (Wix con clases ofuscadas), `quehacemos.com.ar/festivales/catamarca` (sin datos + CSS-in-JS), agendas de diarios (notas, no calendarios). Redes sociales (Facebook / Instagram / TikTok) no permiten scraping por ToS y sus APIs oficiales requieren app aprobada por Meta.
- Nuevo adapter `sfvc-agenda` en `events/src/infrastructure/sources/sfvc-agenda.source.ts` con 6 tests unitarios. `web/lib/events/build-sources.ts` reconoce `type='api'` + `config.adapter='sfvc-agenda'`. Fila `event_sources` sembrada tanto en `supabase/seed.sql` como en el proyecto Supabase remoto (`nwvrexqckxjlfjxzctfj`).
- Smoke local: el adapter trae 50 eventos reales de Catamarca (títulos, fechas, lugares, categorías, 37 con imagen). Sin coordenadas porque el Meilisearch no las publica.

Files:
- events/src/infrastructure/sources/sfvc-agenda.source.ts
- events/src/infrastructure/sources/sfvc-agenda.source.test.ts
- events/src/index.ts
- web/lib/events/build-sources.ts
- supabase/seed.sql

Tests:
- `pnpm --filter @haku/events typecheck` y `test` (24 tests, +6 del nuevo adapter) en verde.
- `pnpm --filter @haku/web typecheck` en verde.
- Smoke con `tsx` contra el Meilisearch real: 50 eventos.

SDD requirements satisfied:
- FR-003
