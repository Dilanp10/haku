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
Status: PENDING
Satisfies: NFR-004

Descripción:
Opcional: agregar el índice cuando haya tráfico que lo justifique (T10 de la feature 004).

## TASK-011 — Scrapers de fuentes reales de Catamarca
Status: PENDING
Satisfies: FR-003

Descripción:
Activar una fuente real y ajustar selectores. No bloquea producción.
