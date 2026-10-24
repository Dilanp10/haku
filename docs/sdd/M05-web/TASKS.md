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

## TASK-012 — Tema claro en cada entrada fresca
Status: COMPLETED
Satisfies: FR-004

Descripción:
La app abre siempre en claro, aunque la vez anterior se haya elegido oscuro. El toggle
Oscuro aplica mientras se navega sin recargar (en-memoria + localStorage), pero F5 o un
tab nuevo arrancan de nuevo en claro. El sistema del celular no manda.

Completed:
- 2026-10-23 (v1): `defaultTheme="light"` en el provider. Error de interpretación: eso
  solo cubre la primera visita sin tema guardado; una vez que el usuario tocaba Oscuro,
  localStorage quedaba en "dark" y la siguiente entrada abría en oscuro de nuevo.
- 2026-10-24 (v2): el requisito era "cada vez que entre" y así quedó. Script inline en
  `<head>` del root layout que borra `localStorage.theme` antes de que `next-themes`
  monte, evitando flash de oscuro durante la hidratación. El toggle sigue escribiendo
  localStorage y la elección vive durante la navegación cliente (no recarga la página),
  pero cada carga HTTP vuelve a limpiar.

Files:
- `web/components/theme-provider.tsx`
- `web/app/layout.tsx`

Tests:
- `pnpm typecheck`
- Verificación en navegador: con `localStorage.theme = "dark"` precargado y recarga, la
  app abre en claro (`class="light"`, `bg: #F4EDE1`); click en Más → Oscuro cambia a
  oscuro y navegar por link interno lo preserva; F5 vuelve a claro.

SDD requirements satisfied:
- FR-004

## TASK-015 — Fix: /mapa crasheaba con eventos sin coordenadas
Status: COMPLETED
Satisfies: FR-001

Descripción:
En producción, `/mapa` tiraba `TypeError: Cannot read properties of undefined
(reading 'lat')` y mostraba la pantalla de error de Vercel. Causa: el adapter de
`@haku/events` omite la propiedad `location` cuando `lat` o `lng` son null (en vez
de setear `location: null`), así que `event.location` queda `undefined`. El filtro
`.filter(e => e.location !== null)` dejaba pasar `undefined`, y después
`e.location!.lat` crasheaba. Al 2026-10-24 había 6 de 10 eventos sin coordenadas
disparando el error.

Completed:
- 2026-10-24: filtro cambiado a `!= null` (atrapa null y undefined) tanto para
  venues como para events en `/mapa`. Fix mínimo donde se usa, no se tocó el
  adapter de `@haku/events` para no cambiar su shape público.

Files:
- `web/app/(site)/mapa/page.tsx`

Tests:
- `pnpm --filter @haku/web build` + `pnpm start` + request a `/mapa`: antes del fix
  log mostraba el `TypeError`; después del fix HTTP 200 limpio, resto de rutas
  (/, /lugares, /eventos, /buscar, /mas) también 200.

SDD requirements satisfied:
- FR-001

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
del ícono— en grande, sosteniéndose y desvaneciéndose a lo largo de 3 s.

Completed:
- 2026-10-23: el timing vive en dos keyframes de `globals.css` en vez de encadenar
  timers. El velo se sostiene opaco hasta el 70% y recién ahí se desvanece, así que la
  app aparece detrás en el último tramo; la marca entra con un scale corto y sigue
  creciendo hasta 1.06 mientras se disuelve. Con `prefers-reduced-motion` la marca pierde
  el scale y queda solo el fade. Se mantiene el gate de `sessionStorage`: una vez por
  sesión de navegador.
- 2026-10-23 (ajuste): de 2,5 s a 3 s, corriendo el hold del 60% al 70%.
- 2026-10-23 (ajuste 2): seguía viéndose corto, y la causa de fondo no era la duración.
  Con el ciclo entero en un keyframe, el reloj arrancaba en el primer pintado del HTML:
  en una carga lenta buena parte del splash transcurría antes de que se viera algo. Ahora
  el keyframe solo hace la entrada y la salida la dispara el cliente (clase
  `splash-leaving`) tras `HOLD_MS`, así que el hold se cuenta desde que la app está lista
  y no se consume en la espera. Quedan 2,8 s de marca a plena vista + 1 s de fade.
  `haku-splash-hold` (9 s) es el failsafe si el JS nunca corre: sin él, un fallo de
  hidratación dejaría el velo tapando la app para siempre.

Files:
- `web/components/splash-screen.tsx`
- `web/app/globals.css`

Tests:
- `pnpm typecheck`, `pnpm lint`
- Ciclo real medido en el navegador: hold opaco hasta ~2,8 s, `splash-leaving` a 2,95 s,
  desmontado a 4,1 s. Fade de salida muestreado aparte: 0.96 → 0.84 → 0.68 → 0.47 → 0.21
  → 0 en ~1 s.
- Nota de verificación: con el panel del navegador oculto las animaciones se congelan y la
  opacidad se lee siempre en 1 aunque las clases cambien. Medir con el panel visible.

SDD requirements satisfied:
- FR-006
