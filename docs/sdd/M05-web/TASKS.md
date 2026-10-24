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

## TASK-012 — Tema claro como default de la primera visita
Status: COMPLETED
Satisfies: FR-004

Descripción:
La app abría siguiendo el tema del sistema, así que en un celular en modo oscuro la
primera impresión era el Tierra dark. El claro pasa a ser el default; el oscuro queda
como elección explícita desde Más → Tema, que conserva las tres opciones.

Completed:
- 2026-10-23: `defaultTheme="light"` en el provider (se mantiene `enableSystem` para que
  la opción "Sistema" del selector siga resolviendo). `themeColor` deja de depender de
  `prefers-color-scheme`, que con el default fijo habría pintado la barra del navegador
  oscura sobre una app clara.

Files:
- `web/components/theme-provider.tsx`
- `web/app/layout.tsx`

Tests:
- `pnpm typecheck`, `pnpm test`
- Verificación en navegador con `prefers-color-scheme: dark` emulado y `localStorage`
  limpio: la app abre en claro; el selector Claro/Oscuro/Sistema sigue respondiendo.

SDD requirements satisfied:
- FR-004

## TASK-013 — Inicial del nombre como placeholder de foto
Status: COMPLETED
Satisfies: FR-008

Descripción:
Reemplaza el emoji de categoría por la inicial del nombre, y cubre además el caso que
antes quedaba descubierto: la foto existe pero falla al cargar (host caído, 404), donde
`next/image` dejaba un hueco.

Completed:
- 2026-10-23: `CoverImage` centraliza los dos casos (sin URL y `onError`) y renderiza la
  inicial en la serif de marca sobre el wash de la categoría. En eventos reemplaza al
  bloque de fecha, y el héroe del detalle de evento pasa a tener placeholder (antes se
  omitía el bloque entero).

Files:
- `web/components/cover-image.tsx` (nuevo)
- `web/components/venue-card.tsx`
- `web/components/event-card.tsx`
- `web/app/(site)/lugares/[slug]/page.tsx`
- `web/app/(site)/eventos/[slug]/page.tsx`

Tests:
- `pnpm typecheck`, `pnpm test`
- Verificación en navegador: "Café del Centro" sin foto muestra `C`; forzando `error` en
  la imagen de "Lo de Lalo" el thumb pasa a `L`; legible en claro y en oscuro.

SDD requirements satisfied:
- FR-008

## TASK-014 — Splash con la H de marca desvaneciéndose
Status: COMPLETED
Satisfies: FR-006

Descripción:
El splash mostraba "Haku." + "vamos" durante 1 s. Pasa a la H en serif italic —la misma
del ícono— en grande, sosteniéndose y desvaneciéndose a lo largo de 2,5 s.

Completed:
- 2026-10-23: el timing vive en dos keyframes de `globals.css` en vez de encadenar
  timers. El velo se sostiene opaco hasta el 60% y recién ahí se desvanece, así que la
  app aparece detrás en el último segundo; la marca entra con un scale corto y sigue
  creciendo hasta 1.06 mientras se disuelve. Con `prefers-reduced-motion` la marca pierde
  el scale y queda solo el fade. Se mantiene el gate de `sessionStorage`: una vez por
  sesión de navegador.

Files:
- `web/components/splash-screen.tsx`
- `web/app/globals.css`

Tests:
- `pnpm typecheck`, `pnpm lint`
- Verificación en navegador congelando la animación: a 400 ms velo opaco con la H sólida,
  a 1900 ms velo en 0.79 con la app asomando, a 2300 ms en 0.31. El overlay se desmonta a
  los 2,5 s.

SDD requirements satisfied:
- FR-006
