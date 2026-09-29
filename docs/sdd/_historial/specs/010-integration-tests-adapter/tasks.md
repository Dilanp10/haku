# Tasks — Integration Tests Adapter

> Lista accionable derivada de `plan.md`. Cada tarea: pequeña, testeable, con un
> "hecho" sin ambigüedad. Marcar `[x]` al completar.

## Convenciones
- `T1`, `T2`, ... — orden recomendado.
- `[P]` tarea paralelizable.
- `[B]` bloqueante para otras.

## Tareas

### Bloque A — Core (paralelizable con Bloque B)

- [x] T1 [B] — Crear `core/vitest.integration.config.ts`: incluye solo `*.integration.test.ts`, timeout 15 000 ms, no `passWithNoTests`.
- [x] T2 [B] — Agregar script `"test:integration": "vitest run --config vitest.integration.config.ts"` en `core/package.json`.
- [x] T3 [P] — Escribir `core/src/infrastructure/supabase-core.repository.integration.test.ts`:
  - Setup: `createClient` con env vars; `createSupabaseCoreRepository`.
  - `listVenues` (published): INSERT venue `__test__-list-pub` → aparece en items.
  - `listVenues({ status: 'draft' })`: INSERT venue `__test__-list-draft` → aparece; published no.
  - `getVenueBySlug` happy path: INSERT venue → retorna venue con slug correcto.
  - `getVenueBySlug` miss: slug `__test__-no-existe` → retorna `null`.
  - `createVenue`: lee `listCategories()` para obtener categorySlug → crea venue → id definido; row en DB.
  - `updateVenue`: INSERT venue → `updateVenue(id, { name: '__test__-updated' })` → name cambiado.
  - `listCategories`: resultado no vacío; cada item tiene `id`, `slug`, `name`.
  - `listFoodTypes`: resultado no vacío; cada item tiene `id`, `slug`, `name`.
  - `searchVenuesNearby`: INSERT venue con `lat: -28.4`, `lng: -65.7` → aparece con radio 5 km; fuera de radio no aparece.
  - `afterEach`/`afterAll`: DELETE venues con slug `LIKE '__test__%'` + `venue_food_types` previo.

### Bloque B — Events (paralelizable con Bloque A)

- [x] T4 [B] — Crear `events/vitest.integration.config.ts`: misma config que T1 (incluye solo `*.integration.test.ts`, timeout 15 000 ms).
- [x] T5 [B] — Agregar script `"test:integration": "vitest run --config vitest.integration.config.ts"` en `events/package.json`.
- [x] T6 [P] — Escribir `events/src/infrastructure/supabase-event.repository.integration.test.ts`:
  - Setup: `createClient` con env vars; `createSupabaseEventRepository`.
  - `upsertMany` insert: evento con `external_id: '__test__-upsert-' + Date.now()` → `inserted: 1`.
  - `upsertMany` deduplicación: segunda llamada con mismo `dedupe_hash` → `inserted: 0, updated: 1`.
  - `listUpcoming`: INSERT evento `published` con `starts_at` en +1h → aparece; evento `published` pasado no.
  - `getBySlug` happy path: INSERT evento → retorna evento con slug correcto.
  - `getBySlug` miss: slug `__test__-no-existe` → retorna `null`.
  - `listPending`: INSERT evento `pending` → aparece; INSERT evento `published` → no aparece en listPending.
  - `updateStatus`: INSERT evento `pending` → `updateStatus(id, 'published')` → status es `published`.
  - `listAll(null)`: INSERT 2 eventos distintos → ambos aparecen.
  - `listAll('published')`: INSERT 1 published + 1 pending → solo el published.
  - `listNearby`: INSERT evento `published` futuro con `lat: -28.4`, `lng: -65.7` → aparece con radio 5 km.
  - `update`: INSERT evento → `update(id, { title: '__test__-titulo-nuevo' })` → title cambiado.
  - `afterEach`/`afterAll`: DELETE eventos con slug `LIKE '__test__%'`.

### Bloque C — Infraestructura compartida (sin dependencias)

- [x] T7 [P] — Actualizar `.env.example`: agregar sección `# Tests de integración` con `SUPABASE_URL` y `SUPABASE_SERVICE_ROLE_KEY` y nota de que se cargan desde `.env.test.local`.
- [x] T8 [P] — Agregar `.env.test.local` al `.gitignore` si no está ya.

### Bloque D — CI (depende de T2, T3, T5, T6)

- [x] T9 [B] — Agregar job `integration` a `.github/workflows/ci.yml`:
  - `runs-on: ubuntu-latest`.
  - Setup pnpm + Node igual que job `verify`.
  - `pnpm install --frozen-lockfile`.
  - Step `supabase/setup-cli@v1` para instalar el CLI de Supabase.
  - Step `supabase start` + `supabase db reset`.
  - Step `supabase status --output json` para capturar `service_role_key` y `api_url`; exportar como `SUPABASE_SERVICE_ROLE_KEY` y `SUPABASE_URL`.
  - Step `pnpm --filter @haku/core test:integration`.
  - Step `pnpm --filter @haku/events test:integration`.

## Verificación final (definition of done)
- [ ] `pnpm -r typecheck` pasa sin errores.
- [ ] `pnpm -r test` (unitarios) pasa sin Supabase corriendo.
- [ ] `pnpm --filter @haku/core test:integration` pasa con `supabase start` activo.
- [ ] `pnpm --filter @haku/events test:integration` pasa con `supabase start` activo.
- [ ] AC1–AC6 del spec verificados.
- [ ] `.env.example` documenta las vars de test.
- [ ] `BACKLOG.md` actualizado con la Fase 23.
