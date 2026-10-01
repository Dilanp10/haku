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

---

# Rediseño Mono/Noche (aprobado 2026-10-01)

## TASK-100 — Tokens de color Mono/Noche y tipografía Geist
Status: TODO
Satisfies: FR-010, FR-011

Descripción:
Reemplazar tokens Tierra en `globals.css` por Mono (`:root`) y Noche (`.dark`). Instalar Geist como única tipografía. Mapear variables shadcn al nuevo sistema. Mantener tokens Tierra solo dentro de `.admin-layout` (D2).

Files:
- `web/app/globals.css`
- `web/app/layout.tsx`
- `web/tailwind.config.ts`

## TASK-101 — Navegación: BottomNav 4 tabs + rutas
Status: TODO
Satisfies: FR-015

Descripción:
Cambiar tabs a Explorar (/) / Agenda (/eventos) / Guardados (/perfil/favoritos) / Más (/mas). Redirect `/mapa` → `/`. Iconos: mapa, calendario, corazón, hamburguesa. Acento para tab activo.

Files:
- `web/components/bottom-nav.tsx`
- `web/app/(site)/mapa/page.tsx`

## TASK-102 — Explorar: mapa fullscreen como home
Status: TODO
Satisfies: FR-012, FR-013, NFR-006
Depends: TASK-100

Descripción:
Rehacer `/` como mapa fullscreen + buscador flotante + filtros. Lista de venues abiertos en RSC, mapa lazy. Implementar `ExploreMap`, `PlacesSheet`, `VenuePin`, `PlaceRow`. Pines con logo, seleccionado con anillo del acento, cerrados en gris. Ubicación del usuario con pulso.

Files:
- `web/app/(site)/page.tsx`
- `web/components/explore-map.tsx` (nuevo)
- `web/components/places-sheet.tsx` (nuevo)
- `web/components/venue-pin.tsx` (nuevo)
- `web/components/place-row.tsx` (nuevo)

## TASK-103 — Tiles CARTO Positron / Dark Matter
Status: TODO
Satisfies: FR-012 (D1)
Depends: TASK-102

Descripción:
CARTO Positron en Mono, Dark Matter en Noche. Escuchar cambio de tema y cambiar tiles sin reload. Verificar uso gratuito. Fallback: OSM con filtro CSS. Atribución correcta.

Files:
- `web/components/explore-map.tsx`
- `web/lib/map-tiles.ts` (nuevo)

## TASK-104 — Ficha de lugar rediseñada
Status: TODO
Satisfies: FR-014
Depends: TASK-100

Descripción:
Portada con zoom lento (CSS), estado con barra de progreso del horario, botones "Cómo llegar" (Google/Apple Maps), guardar, llamar. Mini mapa. "Cerca, también abierto".

Files:
- `web/app/(site)/lugares/[slug]/page.tsx`
- `web/components/place-detail.tsx` (nuevo)

## TASK-105 — Agenda rediseñada
Status: TODO
Satisfies: FR-015
Depends: TASK-100

Descripción:
Lista por día con selector de semana. Tabs de categoría. Hora a la izquierda, evento a la derecha. Badge "Próximo" con punto pulsante. Fuente al pie.

Files:
- `web/app/(site)/eventos/page.tsx`

## TASK-106 — Layout desktop: mapa + panel lateral
Status: TODO
Satisfies: FR-007
Depends: TASK-102, TASK-105

Descripción:
Pantallas ≥ 768px: mapa 70% + panel lateral 30% con lista o agenda. Sin BottomNav en desktop.

Files:
- `web/app/(site)/layout.tsx`
- `web/components/desktop-side-panel.tsx` (nuevo)

## TASK-107 — Animaciones con prefers-reduced-motion
Status: TODO
Satisfies: FR-016
Depends: TASK-102, TASK-104

Descripción:
Pines que caen, hoja que sube, punto que late, ruta que se dibuja. Todo CSS. Desactivado con `prefers-reduced-motion: reduce`.

Files:
- `web/app/globals.css`
- Componentes de TASK-102 y TASK-104

## TASK-108 — Splash, skeletons y placeholders actualizados
Status: TODO
Satisfies: FR-006, FR-008
Depends: TASK-100

Descripción:
Splash con colores del tema activo. Skeletons actualizados. Placeholder de venue sin foto: monograma con iniciales.

Files:
- `web/components/splash-screen.tsx`
- `web/components/skeletons.tsx`

## TASK-109 — Accesibilidad AA en ambos temas
Status: TODO
Satisfies: NFR-005
Depends: TASK-100 a TASK-108

Descripción:
Contraste ≥ 4.5:1 en Mono y Noche. Targets táctiles ≥ 44px. Todos los controles son `button`/`a` reales.

## TASK-110 — Limpieza de tokens y componentes Tierra (app pública)
Status: TODO
Depends: TASK-109

Descripción:
Eliminar variables CSS, utilidades y componentes que ya no se usan en la app pública. Verificar imports. Admin conserva Tierra.
