# Plan — Events Ingestion

> Requiere cerrar las preguntas §10 del `spec.md` antes de implementar (invocar
> `speckit-clarify`).

## 1. Arquitectura afectada
- `@haku/events`: completar adapter Supabase (hoy stub), agregar use-cases admin.
- `@haku/web`: nuevas rutas públicas y admin.
- `supabase/migrations`: índices adicionales si el listado público lo necesita.

## 2. Modelo de datos
Sin tablas nuevas (ya existen desde `0003_events.sql`). Posibles ajustes:
- Índice `(status, starts_at)` para acelerar el listado público.

## 3. Ports y use-cases
```ts
interface EventRepository {
  upsertMany(events): Promise<{ inserted, updated }>     // existe
  listUpcoming(q): Promise<Event[]>                       // existe (stub)
  getBySlug(slug): Promise<Event | null>                  // existe (stub)
  listPending(limit): Promise<Event[]>                    // NUEVO
  updateStatus(id, status): Promise<Event>                // NUEVO
}
publishEvent(repo, { id }): Result<Event>                 // NUEVO
rejectEvent(repo, { id }): Result<Event>                  // NUEVO
```

## 4. Infraestructura
- `listUpcoming`: `from('events').select('*').eq('status','published').gte('starts_at', now).order(...).limit(...)`.
- `getBySlug`: `select(...).eq('slug', slug).maybeSingle()`.
- `upsertMany`: `upsert(events, { onConflict: 'dedupe_hash' })`.
- `listPending`: requiere admin → usar cliente del request (RLS admin) o `service_role`.
- Primer scraper concreto: clase `HtmlSource` parametrizada con selectores de la fuente
  elegida (a decidir en clarify).

## 5. UI / Server Actions / route handlers
- `/eventos` (RSC + ISR ~300s): `listUpcomingEvents`.
- `/eventos/[slug]` (RSC + ISR): `getEventBySlug`.
- `/admin/eventos` (RSC, dynamic): lista pending + acciones.
  - Server Action `publishEventAction`: `requireProfile('admin')` + `publishEvent`
    + `revalidatePath('/eventos')`.
- `/api/events/ingest` ya existe; falta cablear las fuentes activas desde
  `event_sources` (hoy hay una fuente plantilla hardcodeada).

## 6. Tests
- Unit: `publishEvent` / `rejectEvent` con fake repo.
- Reuso del test existente de `runIngestion` (dedupe + resiliencia).
- Integración opcional: el primer scraper con HTML pinneado en fixture.

## 7. Riesgos
- Cambio del DOM de la fuente → test con fixture + alerta cuando `summary.errors` > 0.
- `service_role` en el endpoint de ingesta es necesario para upsert; mantener
  controlado por `EVENTS_INGEST_TOKEN`.

## 8. Orden
1. Cerrar preguntas en spec (fuente, reintentos, cron).
2. Adapter Supabase de `listUpcoming` / `getBySlug` / `upsertMany`.
3. Cargar fuentes activas desde `event_sources` en `/api/events/ingest`.
4. Use-cases `publishEvent` / `rejectEvent` + tests.
5. `/admin/eventos` (page + actions + form).
6. `/eventos` y `/eventos/[slug]`.
7. Primer scraper real + fixture de test.
8. Documentar el cron en `docs/`.
