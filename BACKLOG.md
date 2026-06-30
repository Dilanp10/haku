# BACKLOG — Haku

Priorizado. Cada ítem se desarrolla por SDD (spec → plan → tareas → implementación).

## Fase 0 — Fundación (ESTA ENTREGA) ✅
- [x] Monorepo pnpm + tsconfig base + convenciones.
- [x] SPEC maestro + constitución + CLAUDE/AGENTS.
- [x] Specs por módulo: shared, auth, core, events.
- [x] Scaffolding base de cada módulo (ports/domain/index stubs).
- [x] Supabase: migraciones (auth/core/events) con RLS estricta + seed.
- [x] Next.js (web) base + clientes Supabase + middleware de sesión.
- [x] Docker + docker-compose + Skaffold + manifiestos k8s.

## Fase 1 — Núcleo de descubrimiento (Core) ✅
- [x] `shared`: Result, errores, esquemas geo/paginación, tipos `Database`.
- [x] `core`: use-cases `listVenues`, `getVenueBySlug`, `searchVenuesNearby`, `listCategories`, `listFoodTypes` + tests.
- [x] `core`: adapter Supabase + API pública.
- [x] `web`: listado de lugares (ISR) con filtros por categoría/precio/búsqueda + paginación.
- [x] `web`: detalle de lugar con mapa Leaflet.
- [x] `supabase/seed.sql`: 3 venues de muestra.
- [ ] Tests de integración del adapter contra Supabase local (opcional).

## Fase 2 — Identidad (Auth) ✅
- [x] `auth`: `getCurrentUser`, `getProfile` (impl Supabase real), `requireRole`.
- [x] `web`: `/login` con Server Action, `/logout`, middleware perimetral en `/admin`.
- [x] `web`: `/admin` con guarda `requireProfile('admin')` (composition root auth+core).
- [x] `core`: use-case `createVenue` + `CreateVenueData` port + adapter Supabase.
- [x] `web`: `/admin/lugares/nuevo` con Server Action que compone `@haku/auth` + `@haku/core` + `revalidatePath`.
- [x] [docs/admin-onboarding.md](docs/admin-onboarding.md): cómo promover un usuario a admin.
- [ ] Edición/archivado de venues (similar al patrón de `createVenue`).

## Fase 3 — Eventos (Events) ✅
Ver [`specs/004-events-ingestion/`](specs/004-events-ingestion/spec.md) para spec/plan/tasks completos.

- [x] Decisiones cerradas en spec §10 (fuente: demo, reintentos: manual, cron: documentado).
- [x] Adapter Supabase real: `upsertMany`, `listUpcoming`, `getBySlug`, `listPending`, `updateStatus`.
- [x] `DemoEventSource` con 6 eventos fijos (dedupe estable).
- [x] `/api/events/ingest` carga dinámicamente fuentes activas + actualiza `last_run_at`.
- [x] Use-cases admin: `publishEvent`, `rejectEvent`, `listPendingEvents` + tests.
- [x] `/eventos` (ISR) + `/eventos/[slug]` con mapa.
- [x] `/admin/eventos` con Server Actions de moderación.
- [x] `docs/events-cron.md` + `deploy/k8s/events-cron.yaml`.
- [ ] Scrapers reales de fuentes específicas (features futuras, no bloquean producción).

## Fase 4 — Edición de venues ✅
Ver [`specs/005-venue-editing/`](specs/005-venue-editing/spec.md).
- [x] Use-case `updateVenue` + adapter Supabase + tests.
- [x] `/admin/lugares` (lista con todos los estados) + `/admin/lugares/[slug]/editar`.
- [x] Server Action `updateVenueAction` con revalidación de ISR.

## Fase 5 — Cerca tuyo + quality gates ✅
- [x] CI: GitHub Actions con **lint + typecheck + test**.
- [x] ESLint flat config a nivel raíz con regla `no-restricted-imports` que
      enforça la frontera modular (`@haku/*/src/*` prohibido).
- [x] `/lugares/cerca` (RSC dynamic) + `LocateMe` (geolocation) +
      `searchVenuesNearby` activado end-to-end. Ver
      [`specs/006-lugares-cerca-mio/`](specs/006-lugares-cerca-mio/spec.md).

## Fase 6 — PWA / SEO / OG ✅
Ver [`specs/007-pwa-polish-seo/`](specs/007-pwa-polish-seo/spec.md).
- [x] Metadata sitewide (title template, OG/Twitter, locale es-AR, manifest, theme color).
- [x] `generateMetadata` dinámica en detalle de venue y evento.
- [x] OG image **dinámica** en `/lugares/[slug]` con `next/og` (edge runtime).
- [x] Default OG image sitewide.
- [x] `sitemap.ts` dinámico (venues+events publicados) + `robots.ts`.
- [x] `noindex` en `/admin/*`, `/login`, `/lugares/cerca`.
- [x] Skip link al contenido + `<main id="main">` en todas las páginas.
- [x] Manifest enriquecido + ícono SVG.
- [ ] Offline básico (Service Worker) — queda en backlog si llega a hacer falta.
- [ ] Iconos PNG legacy — solo si analytics muestra browsers que los exijan.

## Fase 7 — "Eventos cerca tuyo" ✅
Ver [`specs/008-eventos-cerca-tuyo/`](specs/008-eventos-cerca-tuyo/spec.md).
- [x] `events/` port: `listNearby` en `EventRepository`.
- [x] `events/` use-case: `searchEventsNearby` con validación Zod + 3 tests.
- [x] `events/` adapter: `listNearby` con bounding-box SQL + haversine inline.
- [x] `supabase/migrations/0004_events_geo_index.sql`: índice parcial `(lat, lng)`.
- [x] `web/app/eventos/cerca/page.tsx`: RSC force-dynamic, noindex, mapa + lista por distancia.
- [x] CTA "Ver eventos cerca tuyo" en `/eventos`.

## Fase 8 — Scraper Sources (HTML + iCal) ✅
Ver [`specs/009-scraper-sources/`](specs/009-scraper-sources/spec.md).
- [x] `HtmlSource` completo con config CSS selectors por JSONB en DB.
- [x] `ICalSource` con parser RFC 5545 inline (sin deps externas).
- [x] Route handler activa tipo `ical` + pasa `config` al `HtmlSource`.
- [x] Seed actualizado con 2 ejemplos desactivados (html + ical) listos para configurar.
- [x] `docs/adding-a-source.md`: guía operativa completa.
- [x] Tests: HtmlSource (2), ICalSource (2).

## Fase 9 — UI polish ✅
- [x] Route group `(site)/` — SiteNav + SiteFooter solo en páginas públicas.
- [x] Home viva: venues destacados + próximos eventos desde DB (ISR).
- [x] Nav activo (`usePathname`) + footer.
- [x] Venue detail page: mapa, food types, teléfono, web, Instagram.
- [x] Event detail page: mapa, fecha fin, CTA externo, categoría.
- [x] Admin dashboard con 4 stat cards (venues/events por estado, fuentes, por moderar).

## Fase 10 — Filtros completos en /lugares ✅
- [x] `SearchInput`: barra de búsqueda (form GET, preserva otros filtros).
- [x] `PricePills`: pills de precio ($, $$, $$$).
- [x] `FoodTypePills`: pills de tipo de comida.
- [x] `CategoryPills` actualizado para preservar filtros cruzados.
- [x] `/lugares` expone los 4 filtros: categoría, precio, tipo de comida, búsqueda.

## Fase 11 — "Sugerir un lugar" ✅
- [x] `CreateVenueData` + `createVenue` use-case + adapter ampliados con `phone`/`website`/`instagram`.
- [x] `supabase/migrations/0005_venues_public_suggest.sql`: política RLS que permite INSERT anon con `status='draft'`.
- [x] `web/app/(site)/lugares/sugerir/actions.ts`: Server Action con Zod + slug autogenerado (`kebab-{random6}`).
- [x] `web/app/(site)/lugares/sugerir/suggest-form.tsx`: cliente `useActionState`, 7 campos, success screen.
- [x] `web/app/(site)/lugares/sugerir/page.tsx`: RSC que carga categorías + renderiza el formulario.
- [x] CTA "+ Sugerir lugar" en `/lugares` (header, junto a "Cerca tuyo").

## Fase 12 — Admin edición completa ✅
- [x] `UpdateVenueData` + use-case + adapter ampliados con `phone`/`website`/`instagram`.
- [x] Form de edición `/admin/lugares/[slug]/editar`: agrega fieldset Contacto (teléfono, web, Instagram).
- [x] `QuickStatusBtn`: acción rápida Publicar / Archivar / Reactivar desde la lista admin, sin entrar al form.
- [x] `/admin/lugares/actions.ts`: Server Action `quickStatusAction` (llama `updateVenue` con solo `{ status }`).

## Fase 13 — Filtros en /eventos ✅
- [x] `ListUpcomingQuery` + use-case ampliados con `search`.
- [x] `EventRepository` port: nuevo método `listEventCategories()`.
- [x] Adapter: `ilike("title")` para search + `SELECT DISTINCT category` para categorías.
- [x] `/eventos`: barra de búsqueda + pills de categoría + contador + "Limpiar todo".

## Fase 14 — Asignacion de food types en admin ✅
- [x] `CreateVenueData` + `UpdateVenueData` ampliados con `foodTypeIds?: string[]`.
- [x] `createVenue` + `updateVenue` use-cases: schema Zod con array de UUIDs.
- [x] Adapter `createVenue`: INSERT en `venue_food_types` post-insert.
- [x] Adapter `updateVenue`: DELETE+INSERT en `venue_food_types` (reemplazo completo).
- [x] Form de edicion: fieldset "Que encontras" con checkboxes para cada food type.
- [x] Pagina de edicion carga `listFoodTypes` en paralelo y lo pasa al form.

## Fase 15 - Paridad form nuevo + filtro admin ✅
- [x] Form "Nuevo lugar": food types checkboxes + fieldset contacto (tel/web/instagram).
- [x] Page nuevo: carga `listFoodTypes` en paralelo con `listCategories`.
- [x] Action "Nuevo lugar": lee `foodTypeIds` y campos de contacto del FormData.
- [x] `ListVenuesQuery` + use-case + adapter: soporte de filtro por `status`.
- [x] `/admin/lugares`: pills Todos / Borradores / Publicados / Archivados via `?estado=`.

## Fase 16 - Cover image upload ✅
- [x] `supabase/migrations/0006_storage_venue_images.sql`: bucket publico `venue-images` + RLS.
- [x] `UpdateVenueData` + use-case + adapter: soporte de `coverImageUrl` nullable.
- [x] Server Action edicion: upload a Storage con admin client, guarda URL publica.
- [x] `CoverImageField`: preview en tiempo real (ObjectURL), checkbox "Eliminar imagen".
- [x] Form de edicion muestra preview de la imagen actual y permite reemplazarla.

## Fase 17 - next/image optimization ✅
- [x] `next.config.ts`: `remotePatterns` para Supabase Storage (.supabase.co/.supabase.in + localhost:54321).
- [x] `VenueCard`: `<img>` -> `<Image fill sizes>` con responsive sizes.
- [x] Venue detail: `<img>` -> `<Image fill priority>` (LCP, precarga en el browser).
- [x] `EventCard`: agrega `loading="lazy" decoding="async"` (mantiene `<img>` por dominios arbitrarios de scrapers).

## Fase 18 - Busqueda global ✅
- [x] `/buscar/page.tsx`: RSC force-dynamic, consulta `listVenues` + `listUpcomingEvents` en paralelo con `?q=`.
- [x] Resultados en dos secciones (Lugares / Eventos) con item compacto (nombre, meta, categoria).
- [x] Link "Ver los N resultados" en cada seccion apunta a `/lugares?q=` y `/eventos?q=` respectivamente.
- [x] `SiteNav`: icono Search que expande un input inline; submit navega a `/buscar?q=...`; Escape lo cierra.
- [x] Estado vacío y estado sin resultados con CTAs de escape.

## Fase 19 - Admin eventos completo ✅
- [x] `EventRepository` port: nuevo metodo `listAll(status | null, limit)`.
- [x] Adapter Supabase: `listAll` filtra por status opcional, ordena por `starts_at desc`.
- [x] Use-case `listAllEvents` con validacion de limit + export desde index.
- [x] Tests (3 fakes): `listAll: async () => []`.
- [x] `quickEventStatusAction`: Server Action generico que llama `repo.updateStatus`.
- [x] `QuickEventStatusBtn`: cliente con `useTransition`; pending->Publicar, published->Retirar, rejected->Reactivar.
- [x] `/admin/eventos`: pills Todos/Pendientes/Publicados/Rechazados via `?estado=`, badge de estado por fila, quick-action button.

## Fase 20 - OG image dinamica para eventos ✅
- [x] `web/app/(site)/eventos/[slug]/opengraph-image.tsx`: edge runtime, 1200x630.
- [x] Gradiente azul/indigo (diferenciado del naranja/rojo de lugares).
- [x] Muestra titulo (font size adaptativo por longitud), fecha/hora formateada y venue.
- [x] Llama `repo.getBySlug` directo (mismo patron que venues).

## Fase 21 - Admin editar evento ✅
- [x] `UpdateEventData` port + `update(id, data)` en `EventRepository`.
- [x] Adapter: patch dinamico (solo keys presentes), `starts_at`/`ends_at`/`venue_name` etc.
- [x] Use-case `updateEvent` con Zod (uuid, datetime, url, max lengths).
- [x] Tests (3 fakes): `update: async (id) => event`.
- [x] `/admin/eventos/[slug]/editar/`: page RSC + `EditEventForm` (useActionState) + Server Action con redirect.
- [x] Boton "Editar" en cada fila de `/admin/eventos`.

## Fase 22 - Tests de integracion del adapter ✅
- [x] `core/vitest.config.ts` + `core/vitest.integration.config.ts`: separa unitarios de integración.
- [x] `core/src/infrastructure/supabase-core.repository.integration.test.ts`: 10 tests contra Supabase local (listVenues, getVenueBySlug, createVenue, updateVenue, listCategories, listFoodTypes, searchVenuesNearby).
- [x] `events/vitest.config.ts` + `events/vitest.integration.config.ts`: idem para events.
- [x] `events/src/infrastructure/supabase-event.repository.integration.test.ts`: 12 tests (upsertMany dedup, listUpcoming, getBySlug, listPending, updateStatus, listAll, listNearby, update).
- [x] Scripts `test:integration` en `core/package.json` y `events/package.json`.
- [x] `.github/workflows/ci.yml`: job `integration` con `supabase start` + `db reset` + exporta credenciales.
- [x] `.env.example` documenta `SUPABASE_URL` y `SUPABASE_SERVICE_ROLE_KEY` para tests locales.

## Fase 23 - Notificación email al admin en ingesta ✅
- [x] `web/lib/email.ts`: helper `sendAdminIngestionAlert(summary, appUrl)` con Resend SDK, guard si faltan vars, try/catch que nunca relanza.
- [x] `web/lib/env.ts`: `resendApiKey`, `resendFrom` (default `onboarding@resend.dev`), `adminEmail` en `serverEnv`.
- [x] `web/app/api/events/ingest/route.ts`: llama al helper si `summary.inserted > 0`.
- [x] `.env.example`: sección `# Email / Resend` con las 3 vars documentadas.
- [x] Dep `resend` agregada a `web/package.json`.

## Fase 24 - Admin venue detail preview ✅
- [x] `web/app/admin/lugares/[slug]/page.tsx`: RSC `force-dynamic` con barra de acciones (← Lugares, badge status, Editar, QuickStatusBtn, Ver página pública) + layout completo del venue (cover, mapa, food types, contacto).
- [x] `web/app/admin/lugares/page.tsx`: link "Ver detalle" en cada fila de la lista.
- [x] `web/app/admin/lugares/actions.ts`: `revalidatePath(/admin/lugares/[slug])` en `quickStatusAction`.

## Fase 25 — Venue View Count Analytics ✅
- [x] `supabase/migrations/0007_venue_view_count.sql`: columna `view_count bigint NOT NULL DEFAULT 0` + RPC `increment_venue_views` SECURITY DEFINER (solo venues published).
- [x] `@haku/shared`: `view_count` en `Database.venues.Row` e `Insert`.
- [x] `@haku/core`: `viewCount: number` en `Venue` domain + `incrementViewCount` en port + adapter.
- [x] `web/components/view-counter.tsx`: client component que dispara `POST /api/venues/[slug]/view` en `useEffect`.
- [x] `web/app/api/venues/[slug]/view/route.ts`: route handler que incrementa vía RPC con admin client, siempre 204.
- [x] `web/app/(site)/lugares/[slug]/page.tsx`: `<ViewCounter>` agregado (ISR no afectado).
- [x] `web/app/admin/lugares/[slug]/page.tsx`: stat card "Visitas" en sidebar.
- [x] `web/app/admin/lugares/page.tsx`: conteo de visitas junto al slug en cada fila.

## Fase 26 — Venue Favorites ✅
- [x] `supabase/migrations/0008_venue_saves.sql`: tabla `venue_saves (user_id, venue_id, created_at)` con PK compuesta, FK cascade a `auth.users` y `public.venues`, RLS select/insert/delete solo por `auth.uid() = user_id`.
- [x] `@haku/shared`: entrada `venue_saves` en `Database.public.Tables` (Row/Insert/Update/Relationships). Fix estructural: `Views: {[_ in never]: never}` + `Relationships: []` por tabla para satisfacer `GenericSchema` de `@supabase/postgrest-js@2.108.2`.
- [x] `@supabase/ssr` bumpeado de 0.5.2 → 0.10.x para compatibilidad de tipos con `@supabase/supabase-js@2.108.2`.
- [x] `web/app/api/venues/[slug]/saved/route.ts`: GET force-dynamic, resuelve venue_id por slug, retorna `{saved: boolean}` (false si anon).
- [x] `web/app/(site)/lugares/[slug]/actions.ts`: Server Action `toggleFavoriteAction` — check-then-insert/delete con `revalidatePath('/perfil/favoritos')`.
- [x] `web/app/(site)/lugares/[slug]/save-button.tsx`: client component `SaveButton` con estado optimista, `useTransition`, Heart relleno/outline, error inline para anon.
- [x] `web/app/(site)/lugares/[slug]/page.tsx`: `<SaveButton venueId slug>` junto al `<h1>` del venue.
- [x] `web/app/(site)/perfil/favoritos/page.tsx`: página `force-dynamic` con guard auth, grid de venue cards ordenadas por `created_at desc`, estado vacío con CTA.
- [x] `web/app/(site)/layout.tsx` → async RSC que pasa `hasSession={!!profile}` a `SiteNav`.
- [x] `web/components/site-nav.tsx`: prop `hasSession`, link "Favoritos → /perfil/favoritos" solo cuando hay sesión.

## Fase 27 — Venue Ratings ✅
- [x] `supabase/migrations/0009_venue_ratings.sql`: tabla `venue_ratings (user_id, venue_id, rating 1–5, created_at, updated_at)` con PK compuesta, FK cascade, RLS select/insert/update/delete por `auth.uid() = user_id`. Vista `venue_rating_stats` con `AVG + COUNT` + `GRANT SELECT` para anon/authenticated.
- [x] `@haku/shared`: `venue_ratings` en Tables + `venue_rating_stats` en Views (Database type ahora tiene views reales en lugar de `{[_ in never]: never}`).
- [x] `web/app/api/venues/[slug]/my-rating/route.ts`: GET force-dynamic, retorna `{ rating: number | null }` para el usuario actual.
- [x] `web/app/(site)/lugares/[slug]/actions.ts`: + `rateVenueAction(venueId, rating, slug)` con validación Zod, UPSERT y `revalidatePath`.
- [x] `web/app/(site)/lugares/[slug]/rating-display.tsx`: componente presentacional `⭐ 4.2 (17 votos)`.
- [x] `web/app/(site)/lugares/[slug]/rating-picker.tsx`: client component con 5 estrellas, hover, estado optimista, `useTransition`, anon deshabilitado.
- [x] `web/app/(site)/lugares/[slug]/page.tsx`: stats query + `<RatingDisplay>` + `<RatingPicker hasSession>`.
- [x] `web/app/admin/lugares/[slug]/page.tsx`: stat card "Rating" con promedio + conteo.

## Fase 28 — Venue Opening Hours ✅
- [x] `supabase/migrations/0010_venue_hours.sql`: tabla `venue_hours (id uuid PK, venue_id FK cascade, day_of_week 0–6, opens_at time, closes_at time, closed bool)` con UNIQUE `(venue_id, day_of_week)`, RLS habilitada + policy SELECT abierta (writes via service_role).
- [x] `@haku/shared`: `venue_hours` en Tables con Row/Insert/Update/Relationships.
- [x] `web/app/admin/lugares/[slug]/editar/hours-field.tsx`: `"use client"`, 7 filas fijas (Dom–Sáb), checkbox "Cerrado" deshabilita inputs de hora, campos `hours[N][day/opens_at/closes_at/closed]` para el form padre.
- [x] `web/app/(site)/lugares/[slug]/opening-hours.tsx`: `"use client"`, props `hours[]`, calcStatus via `useEffect` (evita hydration mismatch), badge verde/rojo Abierto/Cerrado, tabla compacta con días en español.
- [x] `web/app/admin/lugares/[slug]/editar/actions.ts`: + lógica horarios — parsea 7 filas de FormData, valida `closes_at > opens_at`, DELETE + INSERT via `adminClient`.
- [x] `web/app/admin/lugares/[slug]/editar/page.tsx`: query `venue_hours` + prop `initialHours` a `EditVenueForm`.
- [x] `web/app/admin/lugares/[slug]/editar/edit-venue-form.tsx`: prop `initialHours`, monta `<HoursField>` al final del form.
- [x] `web/app/(site)/lugares/[slug]/page.tsx`: query paralela `venue_hours` + `<OpeningHours hours>` en sidebar.

## Fase 29 — Admin Create Venue ✅
- [x] `web/app/admin/lugares/nuevo/actions.ts`: `createVenueAction` con guard admin, cover image upload via `adminClient` (Storage), `createSupabaseCoreRepository(adminClient)` para bypass de RLS en INSERT, manejo de `ConflictError` (slug duplicado) y `ValidationError`.
- [x] `web/app/admin/lugares/nuevo/new-venue-form.tsx`: form client con `useActionState`, auto-generación de slug desde el nombre (slugify NFD inline, se "fija" al editar manualmente), cover image con preview, todos los campos del venue.
- [x] `web/app/admin/lugares/nuevo/page.tsx`: RSC `force-dynamic`, carga categorías + food types, renderiza `<NewVenueForm>`.
- [x] `web/app/admin/lugares/page.tsx`: link "Nuevo lugar" ya existía — sin cambios requeridos.

## Pendientes
- [ ] Despliegue por Skaffold a un cluster real.
- [ ] Conectar una fuente Catamarca real (activar un source en DB + ajustar selectores).
