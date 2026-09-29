# Feature Spec — Integration Tests Adapter

> Documento de **qué** se construye y **por qué**. No describe cómo (eso va en
> `plan.md`). Léelo como contrato: cualquier ambigüedad acá se decide antes de planear.

## 1. Resumen
Agregar una suite de tests de integración que corre los adapters Supabase de `@haku/core`
y `@haku/events` contra una instancia local real de Supabase (`supabase start`), con
migraciones y seed aplicados. Verifica que cada método del adapter funciona de extremo a
extremo: SQL, RLS, joins y lógica de mapeo.

## 2. Motivación
Los tests unitarios existentes usan fakes (16 en core, 13 en events). Eso valida la
lógica de los use-cases pero no detecta regresiones en SQL, cambios de esquema ni
errores en la interacción con Supabase. Un bug en `rowToVenue` o en una política RLS
solo aparece en producción. Los tests de integración cubren ese hueco con feedback rápido
en CI (`supabase start` en GitHub Actions).

## 3. Objetivos (en alcance)
- O1 — Tests de integración para cada método del adapter de `@haku/core`:
  `listVenues`, `getVenueBySlug`, `createVenue`, `updateVenue`, `listCategories`,
  `listFoodTypes`, `searchVenuesNearby`.
- O2 — Tests de integración para cada método del adapter de `@haku/events`:
  `listUpcoming`, `getBySlug`, `upsertMany`, `listPending`, `updateStatus`,
  `listAll`, `listNearby`, `update`.
- O3 — Cada test arranca con fixtures propios (INSERT antes, DELETE después)
  para ser hermético e independiente del seed.
- O4 — Los tests corren en CI con `supabase start` (GitHub Actions, job separado).
- O5 — Script `test:integration` en cada paquete afectado, separado de `test` (unitarios).

## 4. No-objetivos (fuera de alcance, declarados)
- N1 — No testear use-cases desde los tests de integración (ya cubiertos por unitarios).
- N2 — No testear el router HTTP ni Server Actions (eso sería e2e).
- N3 — No testear la capa de `web/`.
- N4 — No mockear Supabase; los tests de integración usan cliente real.
- N5 — No agregar cobertura de RLS con anon/user key (solo service_role por ahora).

## 5. Usuarios y permisos
Herramienta de desarrollo; sin rol de usuario. Los adapters se instancian con
`service_role` (admin client), igual que en producción para mutaciones admin e ingesta.

## 6. Comportamiento esperado

### Setup
- Antes de cada test: INSERT de fixtures mínimos vía admin client.
- Después de cada test: DELETE de los fixtures (cleanup explícito en `afterEach`/`afterAll`).
- Variables de entorno: `SUPABASE_URL=http://localhost:54321` y
  `SUPABASE_SERVICE_ROLE_KEY=<local key>` vía `.env.test.local` (gitignored).

### Core adapter — casos clave
- `listVenues()` retorna venues `published`, paginados correctamente.
- `listVenues({ status: 'draft' })` retorna solo drafts.
- `getVenueBySlug(slug)` retorna el venue; con slug inexistente lanza `NotFoundError`.
- `createVenue(data)` inserta y retorna el venue con el id generado.
- `updateVenue(id, { name })` actualiza solo el campo indicado.
- `listCategories()` retorna las categorías del seed.
- `listFoodTypes()` retorna los food types del seed.
- `searchVenuesNearby({ lat, lng, radiusKm })` retorna venues dentro del radio.

### Events adapter — casos clave
- `upsertMany([event])` inserta; segunda llamada con mismo `external_id` no duplica.
- `listUpcoming()` retorna eventos `published` con `starts_at >= now`.
- `getBySlug(slug)` retorna el evento; con slug inexistente lanza `NotFoundError`.
- `listPending()` retorna solo eventos `pending`.
- `updateStatus(id, 'published')` cambia el estado correctamente.
- `listAll(null)` retorna todos; `listAll('published')` filtra por estado.
- `listNearby({ lat, lng, radiusKm })` retorna eventos dentro del radio.
- `update(id, { title })` actualiza solo el campo indicado.

## 7. Contratos de módulo afectados
- `core/src/infrastructure/supabase-core.repository.integration.test.ts` — nuevo archivo.
- `events/src/infrastructure/supabase-event.repository.integration.test.ts` — nuevo archivo.
- `core/package.json` — script `test:integration` nuevo.
- `events/package.json` — script `test:integration` nuevo.
- `.github/workflows/ci.yml` — job `integration` con `supabase start` + `db reset`.
- `.env.test.local` — vars para Supabase local (gitignored, documentado en `.env.example`).

No se modifica ningún port, use-case, dominio ni migración existente.

## 8. Criterios de aceptación
- AC1 — `pnpm --filter @haku/core test:integration` pasa con `supabase start` activo.
- AC2 — `pnpm --filter @haku/events test:integration` pasa con `supabase start` activo.
- AC3 — Los tests fallan si Supabase no está corriendo (no son falsos positivos).
- AC4 — `pnpm -r test` (unitarios) no requiere Supabase corriendo.
- AC5 — CI corre el job de integración y pasa en verde.
- AC6 — Cada test es hermético: no depende del orden ni del estado dejado por otro test.

## 9. Riesgos y supuestos
- **Supuesto**: `supabase start` levanta con migraciones aplicadas via `supabase db reset` en CI.
- **Riesgo**: `searchVenuesNearby` y `listNearby` requieren PostGIS; el CLI local lo
  incluye por defecto — si no, el test falla con error claro.
- **Riesgo**: Flakiness por interferencia con datos del seed. Mitigación: slugs y
  `external_id` con prefijo `__test__` y cleanup explícito en `afterEach`.
- **Riesgo**: El job de CI con `supabase start` puede tardar ~60s. Mitigación: cache
  de imagen Docker via Actions cache.

## 10. Preguntas abiertas
Ninguna — el alcance es técnicamente cerrado.
