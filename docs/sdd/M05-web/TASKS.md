# Tasks — M05: web (PWA y UI)

Fuente: SDD.md (Approved). Cada task histórica apunta a su feature en `../_historial/specs/`.

## TASK-001 — PWA polish y SEO
Status: COMPLETED
Satisfies: FR-003
Fuente: 007-pwa-polish-seo

Descripción:
Metadata, Open Graph dinámico, sitemap, robots, manifest e icono SVG.

## TASK-002 — Push notifications
Status: COMPLETED
Satisfies: FR-009
Fuente: 021-push-notifications

Descripción:
Web Push con opt-in, service worker, tabla `push_subscriptions` y envío tras ingesta o alta de evento.

## TASK-003 — Rediseño "Tierra"
Status: COMPLETED
Satisfies: FR-004
Fuente: 022-rediseno-tierra

Descripción:
Paleta, tipografía, list-cards y bottom-nav de 4 tabs.

Completed:
- Backfill. Queda como gate de cierre `pnpm -r typecheck` (ver TASK-009).

## TASK-004 — Rediseño del admin
Status: COMPLETED
Satisfies: FR-005
Fuente: 028-rediseno-admin-tierra

Descripción:
Tema oscuro Tierra, tabla de lugares y pantalla de Sugerencias.

## TASK-005 — Splash screen
Status: COMPLETED
Satisfies: FR-006
Fuente: 029-splash-screen

Descripción:
Bienvenida con el logo "Haku." al abrir la app.

## TASK-006 — Layout de escritorio
Status: COMPLETED
Satisfies: FR-007
Fuente: 030-layout-desktop

Descripción:
Header completo y contenido ancho en desktop.

## TASK-007 — Rediseño visual pulido
Status: COMPLETED
Satisfies: FR-008
Fuente: 031-redise-no-visual-pulido

Descripción:
Skeletons, placeholders de categoría, "abierto primero" y header.

## TASK-008 — Composición y ISR de las rutas públicas y admin
Status: COMPLETED
Satisfies: FR-001, FR-002
Fuente: 002, 003, 005, 006, 008 (partes de `web`)

Descripción:
Server Actions con `requireRole`, RSC + ISR y route handlers.

## TASK-009 — Gate de cierre: typecheck del workspace
Status: COMPLETED
Satisfies: NFR-001

Descripción:
Correr `pnpm -r typecheck` (pendiente en la feature 022) y `pnpm lint` para confirmar que no hay imports cruzados.

Completed:
- 2026-09-29: `pnpm -r typecheck` y `pnpm -r test` en verde (core 23, events 18, web 11 tests). `pnpm lint` no reporta violaciones de frontera; su único error es la referencia triple-slash en `web/next-env.d.ts`, archivo generado por Next.

Files:
- (verificación, sin cambios de código)

Tests:
- `pnpm -r typecheck`, `pnpm -r test`, `pnpm lint`

SDD requirements satisfied:
- NFR-001

## TASK-010 — Service Worker offline básico
Status: PENDING
Satisfies: NFR-004

Descripción:
Opcional, solo si hace falta. Hoy existe `/offline` pero no caché de contenido (backlog).

## TASK-011 — Iconos PNG legacy
Status: PENDING
Satisfies: FR-003

Descripción:
Solo si analytics muestra navegadores que exijan PNG.
