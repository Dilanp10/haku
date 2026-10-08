# SDD — M05: web (PWA y UI)

## 1. Identificación
Module: M05
Name: web — Next.js, PWA y sistema visual (`@haku/web`)
Status: Approved   <!-- aprobado por el usuario el 2026-09-29 (migración desde spec-kit) -->

## 2. Objetivo
Ser el composition root: la única capa que conoce a `core`, `auth` y `events`. Renderiza la
app pública (mobile-first y desktop), el panel admin, la PWA/SEO y las notificaciones push.

## 3. Alcance
Incluye:
- Rutas públicas (`/`, `/lugares`, `/eventos`, `/buscar`, `/mapa`, `/mas`, `/about`, `/perfil`, `/login`, `/offline`).
- Panel `/admin` (lugares, eventos, sugerencias) y route handlers `/api/*` (`cron`, `events`, `health`, `venues`).
- Sistema visual "Tierra" (paleta, tipografía serif/mono, list-cards, bottom-nav de 4 tabs), admin oscuro, splash, layout desktop, skeletons y placeholders.
- PWA + SEO: metadata, Open Graph dinámico, sitemap, robots, manifest e icono SVG.
- Web Push: opt-in, service worker, envío tras ingesta o alta manual de evento.

No incluye:
- Reglas de negocio de venues, eventos o auth (M03, M04, M02): `web` solo compone y presenta.
- Migraciones y despliegue (M06).

## 4. Requisitos funcionales
FR-001 — Componer M02, M03 y M04 en Server Actions y RSC; validar rol con `@haku/auth` antes de toda mutación.
FR-002 — Páginas de lectura con RSC + ISR; mutaciones con Server Actions que revalidan rutas.
FR-003 — Metadata sitewide, Open Graph por venue/evento, `sitemap`, `robots`, manifest e icono SVG.
FR-004 — Sistema visual Tierra público: bottom-nav de 4 tabs, list-cards y componentes compartidos.
FR-005 — Panel admin con tema oscuro Tierra: listado tipo tabla, formularios y pantalla de Sugerencias.
FR-006 — Splash screen en la primera carga de la sesión del browser.
FR-007 — Layout de escritorio: header con navegación completa, contenido ancho y `BottomNav` solo en mobile.
FR-008 — Skeletons de carga, placeholders de categoría para venues sin foto y jerarquía "abierto primero" en la home.
FR-009 — Push notifications: opt-in, service worker, suscripciones (`push_subscriptions`) y envío tras publicar eventos nuevos.

## 5. Requisitos no funcionales
NFR-001 — Ningún otro módulo importa `web`; `web` importa solo APIs públicas `@haku/<modulo>`.
NFR-002 — `SUPABASE_SERVICE_ROLE_KEY` solo en servidor.
NFR-003 — UI en español, código en inglés; Tailwind + shadcn/ui.
NFR-004 — Mobile-first, accesible, sin fetching en cliente salvo interacción.

## 6. Arquitectura del módulo
Next.js 15 App Router: `web/app/(site)`, `web/app/admin`, `web/app/api`, `web/components`, `web/lib`, `middleware.ts`. Leaflet + OSM para mapas. Componentes compartidos `VenueCard`, `EventCard`, `BottomNav`, filtros.

## 7. Flujo de datos
Request → middleware (sesión) → RSC/Server Action → `@haku/auth.requireRole` (si muta) → `@haku/core` / `@haku/events` → Supabase → `revalidatePath` → respuesta.

## 8. Modelo de datos
Sin tablas propias, salvo `push_subscriptions` (migración 0011).

## 9. API
Route handlers: `POST /api/events/ingest` (token), `POST /api/venues/[slug]/view`, `/api/cron/*`, `GET /api/health`.

## 10. Seguridad
Middleware perimetral en `/admin` + guarda profunda; tokens de cron/ingesta; claves VAPID solo en servidor; RLS como red de seguridad.

## 11. Dependencias
M01, M02, M03, M04 (todos implementados). Despliegue en M06.

## 12. Criterios de aceptación
- `pnpm typecheck` y `pnpm test` pasan; `pnpm build` compila.
- Rutas públicas y admin operativas en mobile y desktop.
- Sin imports a rutas internas de otros módulos (regla ESLint activa).
