# SDD — M04: events

## 1. Identificación
Module: M04
Name: events — ingesta y publicación de eventos (`@haku/events`)
Status: Approved   <!-- aprobado el 2026-09-29; FR-010 aprobado por chat el 2026-10-25 -->

## 2. Objetivo
Subsistema aislado que ingiere eventos locales de Catamarca desde fuentes externas, los
modera (pending → published) y los expone públicamente, sin acoplarse al descubrimiento.

## 3. Alcance
Incluye:
- Ingesta (`runIngestion`) con fuentes HTML (selectores CSS) e iCal, normalización y dedupe.
- Moderación admin, alta manual de eventos, listado público y "eventos cerca tuyo".
- Notificación por email al admin tras una ingesta con eventos nuevos.
- Disparo manual de ingesta desde el admin y fuente demo de Catamarca.

No incluye:
- Conocimiento de venues o categorías de core (sin FK a core).
- UI (M05). Las push notifications se envían desde `web` tras ingesta o alta (M05).
- Publicación automática: todo entra como `pending`.

## 4. Requisitos funcionales
FR-001 — `runIngestion(deps, sourceKey?)` corre una o todas las fuentes activas, normaliza, deduplica por `dedupe_hash` y hace upsert con `status='pending'`, devolviendo `{ fetched, inserted, updated, skipped, errors }`.
FR-002 — El fallo de una fuente no aborta las demás; se registra en `errors`.
FR-003 — Fuentes `HtmlSource` (config JSONB) e `ICalSource` (subset RFC 5545), más `DemoEventSource`.
FR-004 — Lectura pública: `listUpcomingEvents` (incluye eventos en curso) y `getEventBySlug`.
FR-005 — Moderación: `publishEvent`, `rejectEvent`, `listPendingEvents`; edición y `listAll` por estado.
FR-006 — Alta manual de evento en `/admin/eventos/nuevo`.
FR-007 — `searchEventsNearby` y página `/eventos/cerca`, solo eventos futuros, por distancia.
FR-008 — `POST /api/events/ingest` protegido por `EVENTS_INGEST_TOKEN`; actualiza `last_run_at`; botón "Disparar ingesta" en el admin.
FR-009 — Tras una ingesta con eventos nuevos se envía email al admin (Resend); si faltan las variables o el envío falla, el endpoint sigue respondiendo `200`.
FR-010 — Deduplicación entre fuentes: dos eventos son el mismo cuando coinciden `normalize_title(title)` y la hora truncada de `starts_at` (misma hora exacta, ignorando minutos y segundos). La ingesta no inserta un duplicado: hace merge preservando campos no-null del evento existente (si el nuevo trae `image_url`, `url` o `description` y el existente no, se completan) y registra el `source_key` del nuevo en `events.extra_sources` (jsonb array). El resumen de `runIngestion` suma el contador `merged`. Para v1 el hash no incluye `venue_name` ni `address`: un falso positivo (dos eventos distintos con mismo título a la misma hora en lugares distintos) se acepta como riesgo conocido y se mitigará si aparece en producción.

## 5. Requisitos no funcionales
NFR-001 — Depende solo de M01; sin imports de `core` ni `auth`.
NFR-002 — Ingesta fuera del request del usuario (cron/job) con `service_role`.
NFR-003 — Scraping cortés: User-Agent identificable, rate-limit, respeto de robots/ToS.
NFR-004 — RLS: lectura pública solo de `published` futuros; escritura `service_role` o admin.
NFR-005 — Tests de use-cases con fakes e integración del adapter contra Supabase local.

## 6. Arquitectura del módulo
`events/src/{domain,application/{ports,use-cases},infrastructure}` + `index.ts`. Ports:
`EventSourcePort`, `EventRepository`. Adapter Supabase real (`upsertMany`, `listUpcoming`,
`getBySlug`, `listPending`, `updateStatus`, `listAll`, `listNearby`, `update`).

## 7. Flujo de datos
Cron / POST `/api/events/ingest` → `runIngestion` → `EventSourcePort.fetch` → normalizar + dedupe → `EventRepository.upsertMany` (pending) → email admin → admin publica → web (ISR) muestra.

## 8. Modelo de datos
`event_sources` (`key`, `type html|ical|api`, `config`, `active`, `last_run_at`) y `events` (`slug`, `starts_at`, `lat/lng`, `status`, `dedupe_hash unique`, `extra_sources jsonb default '[]'`, `raw`, `ingested_at`). Índice geo (migración 0004). `dedupe_hash` se calcula como `md5(normalize_title(title) || '|' || hour_epoch(starts_at))`, **sin incluir `source_key`**, para que el mismo evento desde fuentes distintas colapse al mismo hash. Función SQL `normalize_title` y backfill en migración 0013.

## 9. API
`POST /api/events/ingest` (token) → resumen de ingesta. Respuestas: `200` con resumen, `401` sin token válido.

## 10. Seguridad
`EVENTS_INGEST_TOKEN`; `service_role` solo servidor; RLS estricta; sin FK a core.

## 11. Dependencias
M01 (shared). Consumido por M05 (web). Migraciones 0003, 0004, 0011 y 0013 en M06.

## 12. Criterios de aceptación
- Ingesta idempotente y resiliente; moderación operativa; `/eventos` y `/eventos/cerca` funcionan.
- `pnpm typecheck`, `pnpm test` y `pnpm --filter @haku/events test:integration` pasan.
- Smoke test end-to-end de ingesta ejecutado (ver TASKS.md).
