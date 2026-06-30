# Feature Spec — Events Ingestion

> Estado: **planeado** (Fase 3, próxima).

## 1. Resumen
Ingesta automática de eventos locales de Catamarca desde una o más fuentes web,
moderación admin (pending → published), y exposición pública en `/eventos` (ISR).

## 2. Motivación
Completar el "vamos" de Haku: además de a dónde ir, **cuándo** ir. La ingesta es
periódica, fuera del request del usuario, y resistente a fallos de fuentes externas.

## 3. Objetivos
- O1 — Al menos un scraper concreto de una fuente real de Catamarca.
- O2 — `runIngestion` end-to-end: scrape → normalize → dedupe → upsert `pending`.
- O3 — `/eventos` (ISR) lista eventos `published` y futuros.
- O4 — `/admin/eventos` lista `pending` con acciones publicar/rechazar.
- O5 — Cron / disparo manual vía `POST /api/events/ingest` (ya scaffold).

## 4. No-objetivos
- N1 — Sincronización en tiempo real (cron suficiente).
- N2 — Notificaciones por evento publicado.
- N3 — Calendarios iCal externos (queda para una fase posterior; el port `EventSourcePort`
  ya prevé el tipo `ical`).

## 5. Usuarios y permisos
| Rol     | Puede |
|---------|-------|
| visitor | ver `/eventos` (solo `published` y futuros) |
| admin   | acceder a `/admin/eventos`, publicar/rechazar `pending` |

## 6. Comportamiento esperado
- Cron / `POST /api/events/ingest?source=<key>` con token válido corre la ingesta.
- Cada fuente que falle se registra en `summary.errors` y NO aborta a las demás.
- Eventos duplicados (mismo `dedupe_hash`) se descartan dentro del lote y entre
  corridas (upsert).
- Al publicar un evento, `revalidatePath('/eventos')`.
- Visitor sin filtro alguno ve los próximos N eventos publicados.

## 7. Contratos de módulo
- `@haku/events`:
  - **lectura**: `listUpcomingEvents(repo, input)` (ya existe firma; falta adapter).
  - **ingesta**: `runIngestion(deps, sourceKey?)` (ya implementado).
  - Nuevos: `publishEvent`, `rejectEvent` use-cases (admin) + métodos en `EventRepository`.
- `web`:
  - `/eventos` y `/eventos/[slug]` (RSC + ISR).
  - `/admin/eventos` (RSC + Server Actions de publicar/rechazar).
- **Sin contacto con `@haku/core`** (regla de aislamiento, ya documentada).

## 8. Criterios de aceptación
- AC1 — Una corrida de `runIngestion` con un scraper real inserta `pending` y se
  ven en `/admin/eventos`.
- AC2 — Un visitor NO ve eventos `pending` (RLS + use-case filtrar `status`).
- AC3 — Un evento publicado aparece en `/eventos` (post-revalidate).
- AC4 — Una segunda corrida no duplica eventos (dedupe_hash).
- AC5 — Fallar una fuente no afecta la otra (test ya existente cubre el patrón).
- AC6 — `service_role` se usa solo en el route handler de ingesta, nunca en cliente.

## 9. Riesgos
- HTML de fuentes externas cambia → mitigado por aislamiento (el spec exige
  resiliencia y mensajes claros) + test del happy path con HTML pinneado.
- ToS/robots de la fuente elegida → revisar antes; respetar User-Agent identificable
  (`EVENTS_SCRAPER_USER_AGENT`) y rate-limit.
- Zona horaria de `starts_at` → estandarizar a UTC en la BD; mostrar local en UI.

## 10. Decisiones (resueltas)
- **Fuente inicial**: `DemoEventSource` — genera 6 eventos fijos de Catamarca con
  `startsAt` deterministas (dedupe estable entre corridas). Scrapers reales se
  añaden como features separadas, sin tocar la arquitectura.
- **Política de reintentos**: en cada corrida, los errores de una fuente se acumulan
  en `summary.errors`; no hay desactivación automática. El admin desactiva una
  fuente manualmente seteando `event_sources.active=false` cuando rompe sostenido.
  Si se necesita auto-disable en el futuro, será una feature aparte.
- **Cron en producción**: para esta entrega, disparo manual vía `POST /api/events/ingest`
  con `Bearer EVENTS_INGEST_TOKEN`. Documentado en [`docs/events-cron.md`](../../docs/events-cron.md)
  cómo activar un `CronJob` de Kubernetes o una Supabase scheduled function cuando haya prod.
