# SPEC — `@haku/events` (Ingesta de eventos) — módulo nuevo

> Subsistema **aislado y desacoplado** de scraping/ingesta de eventos locales de
> Catamarca. Depende solo de `@haku/shared`. **No** conoce ni referencia a `core`.

## 1. Por qué aislado (requisito duro)
- Las **fuentes externas son volátiles**: si un scraping rompe, descubrimiento (core)
  debe seguir intacto.
- La ingesta corre **fuera del request del usuario** (cron/job), con `service_role`.
- Sus tablas (`event_*`) **no tienen FK a las tablas de core**. Si en el futuro se quiere
  vincular un evento a un venue, será un campo opcional débil (`venue_slug`), nunca un FK.

## 2. Dos caras separadas de la API pública
### A. Lectura (la consume `web`, ISR)
- `listUpcomingEvents(repo, { from?, limit, category? })` → eventos `published` futuros.
- `getEventBySlug(repo, slug)` → detalle.

### B. Ingesta (la consume un job/cron, NUNCA la UI)
- `runIngestion(deps, sourceKey?)` → corre uno o todos los `EventSource`, normaliza,
  deduplica y hace upsert con estado `pending`. Devuelve un resumen
  `{ fetched, inserted, updated, skipped, errors }`.

## 3. Modelo de dominio
- **RawEvent** (lo que devuelve un scraper): `{ sourceKey, externalId?, title, description?,
  startsAt, endsAt?, venueName?, address?, location?, url?, imageUrl?, category? }`.
- **Event** (normalizado y persistido): RawEvent + `{ id, slug, status, dedupeHash,
  ingestedAt }`.
- **Reglas puras** (`domain/`):
  - `normalize(raw)` → recorta/normaliza campos, genera `slug`.
  - `dedupeHash(raw)` → hash estable de `(sourceKey + title + startsAt)` para evitar
    duplicados entre corridas.

## 4. Ports
```ts
interface EventSourcePort {                 // un scraper por fuente
  readonly key: string;                     // p.ej. "municipalidad-catamarca"
  fetch(now: Date): Promise<RawEvent[]>;    // scraping cortés, sin tocar la BD
}
interface EventRepository {
  upsertMany(events: Event[]): Promise<{ inserted: number; updated: number }>;
  listUpcoming(q: ListUpcomingQuery): Promise<Event[]>;
  getBySlug(slug: string): Promise<Event | null>;
}
```
`runIngestion` recibe `{ sources: EventSourcePort[]; repo: EventRepository; clock?: () => Date }`.

## 5. Pipeline de ingesta
```
for each source:
  raw[] = source.fetch(now)            // si lanza, se captura y se sigue con otras fuentes
  events = raw.map(normalize)          // pura
  dedupe por dedupeHash dentro del lote
  repo.upsertMany(events)              // status='pending'
resumen agregado { fetched, inserted, updated, skipped, errors[] }
```
- **Resiliencia:** el fallo de una fuente no aborta las demás (se registra en `errors`).
- **Cortesía:** User-Agent identificable (`EVENTS_SCRAPER_USER_AGENT`), respeto de
  robots.txt/ToS y rate-limit por fuente.

## 6. Datos / RLS (`supabase/migrations`)
- `event_sources`: `{ id, key unique, name, url, type(html|ical|api), config jsonb,
  active, last_run_at }`. Solo `service_role`/`admin` lee/escribe.
- `events`: `{ id, source_key, external_id, slug unique, title, description, starts_at,
  ends_at, venue_name, address, lat, lng, url, image_url, category, status, dedupe_hash
  unique, raw jsonb, ingested_at }`.
  - `SELECT` público solo de `status='published'` y `starts_at >= now()`.
  - `INSERT/UPDATE` solo `service_role` (job) o `admin` (moderación).

## 7. Disparo (en `web`, no aquí)
`POST /api/events/ingest` protegido por `EVENTS_INGEST_TOKEN`, o un cron de Cloud Code,
invoca `runIngestion`. La moderación (pending→published) es una acción de admin en `web`.

## 8. No-objetivos
- No renderiza UI. No conoce venues/categorías de core.
- No publica automáticamente: todo entra como `pending` para revisión humana.
