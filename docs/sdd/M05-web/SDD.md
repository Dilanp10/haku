# SDD — M05: web (PWA y UI)

## 1. Identificación
Module: M05
Name: web — Next.js, PWA y sistema visual (`@haku/web`)
Status: Approved   <!-- aprobado el 2026-10-01 (rediseño Mono/Noche). Versión anterior aprobada el 2026-09-29. -->

## 2. Objetivo
Ser el composition root: la única capa que conoce a `core`, `auth` y `events`. Renderiza la
app pública (mobile-first y desktop), el panel admin, la PWA/SEO y las notificaciones push.

## 3. Alcance
Incluye:
- Rutas públicas (`/`, `/lugares`, `/eventos`, `/buscar`, `/mapa`, `/mas`, `/about`, `/perfil`, `/login`, `/offline`).
- Panel `/admin` (lugares, eventos, sugerencias) y route handlers `/api/*` (`cron`, `events`, `health`, `venues`).
- Sistema visual **Mono (claro) / Noche (oscuro)**, minimalista y con el mapa como inicio (§13). Reemplaza al sistema "Tierra" en la app pública.
- Splash, layout desktop, skeletons y placeholders, adaptados al nuevo sistema.
- PWA + SEO: metadata, Open Graph dinámico, sitemap, robots, manifest e icono SVG.
- Web Push: opt-in, service worker, envío tras ingesta o alta manual de evento.

No incluye:
- Reglas de negocio de venues, eventos o auth (M03, M04, M02): `web` solo compone y presenta.
- Migraciones y despliegue (M06).
- Rediseño del panel `/admin` (sigue con el tema Tierra oscuro; ver D2 en §13).

## 4. Requisitos funcionales
FR-001 — Componer M02, M03 y M04 en Server Actions y RSC; validar rol con `@haku/auth` antes de toda mutación.
FR-002 — Páginas de lectura con RSC + ISR; mutaciones con Server Actions que revalidan rutas.
FR-003 — Metadata sitewide, Open Graph por venue/evento, `sitemap`, `robots`, manifest e icono SVG.
FR-004 — ~~Sistema visual Tierra público~~ → **reemplazado por FR-010 a FR-015** (2026-10-01).
FR-005 — Panel admin con tema oscuro Tierra: listado tipo tabla, formularios y pantalla de Sugerencias.
FR-006 — Splash screen en la primera carga de la sesión del browser, con los colores del tema activo.
FR-007 — Layout de escritorio: mapa a pantalla completa con panel lateral fijo (lista de lugares o agenda) a la izquierda; sin `BottomNav`.
FR-008 — Skeletons de carga y placeholders para venues sin foto (monograma con iniciales, sin imagen rota), en el nuevo sistema.
FR-009 — Push notifications: opt-in, service worker, suscripciones (`push_subscriptions`) y envío tras publicar eventos nuevos.
FR-010 — **Dos temas**: Mono (claro: blanco, negro y un acento coral) y Noche (oscuro: grises casi negros y un acento menta). Por defecto sigue el modo del sistema; el usuario puede fijarlo desde "Más" (ya existe `next-themes` y la fila de tema).
FR-011 — **Tokens únicos**: una sola tipografía (Geist), mismos radios, espaciados y componentes en los dos temas; solo cambian los colores por variables CSS. El acento significa siempre "seleccionado / abierto".
FR-012 — **Explorar (nuevo inicio `/`)**: mapa a pantalla completa con buscador flotante y filtros (Abierto ahora, Bares, Cafés, Restós); pines con el logo del lugar; el seleccionado se agranda con anillo del acento; los cerrados se ven en gris; ubicación del usuario con pulso.
FR-013 — **Hoja inferior** sobre el mapa con la lista vertical de lugares abiertos (logo, nombre, categoría · barrio, hora de cierre a la derecha; "cierra pronto" resaltado). Tocar un lugar o su pin lo selecciona y muestra la acción "Cómo llegar".
FR-014 — **Ficha de lugar** (`/lugares/[slug]`): portada con zoom lento, nombre, categoría y dirección, estado y horario de hoy con barra de progreso, botones "Cómo llegar" (abre la app de mapas del sistema), guardar y llamar, mini mapa y "Cerca, también abierto".
FR-015 — **Navegación**: 4 pestañas Explorar / Agenda / Guardados / Más. `/mapa` redirige a `/`; el listado `/lugares` queda accesible desde "Ver lista"; Guardados = `/perfil/favoritos`; Agenda = `/eventos` como lista limpia por día con el próximo evento marcado.
FR-016 — **Movimiento**: pines que caen, hoja que sube, puntos que laten, recorrido que se dibuja; todo desactivado con `prefers-reduced-motion`.

## 5. Requisitos no funcionales
NFR-001 — Ningún otro módulo importa `web`; `web` importa solo APIs públicas `@haku/<modulo>`.
NFR-002 — `SUPABASE_SERVICE_ROLE_KEY` solo en servidor.
NFR-003 — UI en español, código en inglés; Tailwind + shadcn/ui.
NFR-004 — Mobile-first, accesible, sin fetching en cliente salvo interacción.
NFR-005 — Contraste AA en los dos temas (texto ≥ 4.5:1); objetivos táctiles ≥ 44 px; todo control es un `button`/`a` real.
NFR-006 — El mapa no bloquea el primer render: la lista de abiertos se renderiza en servidor (RSC) y el mapa se hidrata después.

## 6. Arquitectura del módulo
Next.js 15 App Router: `web/app/(site)`, `web/app/admin`, `web/app/api`, `web/components`, `web/lib`, `middleware.ts`. Leaflet para mapas (proveedor de tiles: ver D1). Tokens de diseño en `globals.css` (`:root` = Mono, `.dark` = Noche). Componentes nuevos o rehechos: `ExploreMap`, `VenuePin`, `PlacesSheet`, `PlaceRow`, `PlaceDetail`, `AgendaList`, `BottomNav` (4 tabs nuevas), `DesktopSidePanel`.

## 7. Flujo de datos
Request → middleware (sesión) → RSC/Server Action → `@haku/auth.requireRole` (si muta) → `@haku/core` / `@haku/events` → Supabase → `revalidatePath` → respuesta.
Explorar: RSC trae venues publicados + estado abierto (`openStateAt`) → render de la hoja → cliente hidrata el mapa con los mismos datos (sin segundo fetch).

## 8. Modelo de datos
Sin tablas propias, salvo `push_subscriptions` (migración 0011). El rediseño no cambia el modelo.

## 9. API
Route handlers: `POST /api/events/ingest` (token), `POST /api/venues/[slug]/view`, `/api/cron/*`, `GET /api/health`.

## 10. Seguridad
Middleware perimetral en `/admin` + guarda profunda; tokens de cron/ingesta; claves VAPID solo en servidor; RLS como red de seguridad. La geolocalización del usuario se usa solo en el cliente y no se envía al servidor.

## 11. Dependencias
M01, M02, M03, M04 (todos implementados). Despliegue en M06.

## 12. Criterios de aceptación
- `pnpm typecheck` y `pnpm test` pasan; `pnpm build` compila.
- Rutas públicas y admin operativas en mobile y desktop.
- Sin imports a rutas internas de otros módulos (regla ESLint activa).
- Explorar, ficha de lugar y Agenda se ven como las maquetas aprobadas en los dos temas, en mobile y desktop.
- El cambio de tema (sistema / claro / oscuro) se aplica sin recargar y sin parpadeo.

## 13. Cambio 2026-10-01 — Rediseño Mono / Noche

**Origen:** exploración de diseño en el canvas "Haku — Rediseño" (https://claude.ai/artifact/USX3SQWyCzMPTAZbF88t35). El usuario eligió el estilo minimalista con el mapa como inicio, en dos temas: claro (Mono) y oscuro (Noche).

**Impacto:**
- Visual: reemplaza el sistema Tierra en toda la app pública (FR-004 → FR-010 a FR-016).
- Navegación: el inicio pasa de lista a mapa; cambian las pestañas (FR-015).
- Sin cambios de datos, API ni de otros módulos. `openStateAt` (M03) se reutiliza tal cual.

**Decisiones resueltas (aprobadas 2026-10-01):**
- **D1 — Proveedor del mapa base.** → CARTO Positron (claro) / Dark Matter (oscuro). Verificar condiciones de uso gratuito antes de implementar; si no alcanzan, fallback a OSM con filtro CSS.
- **D2 — Panel `/admin`.** → Se deja como está (Tierra oscuro). Se rediseñará en otra tarea futura.
- **D3 — Home anterior.** → El listado "abierto primero" pasa a la hoja del mapa en `/`. `/lugares` se mantiene como lista completa.
