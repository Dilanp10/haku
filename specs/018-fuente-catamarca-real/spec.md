# Feature Spec -- Fuente Catamarca Real

> Documento de **que** se construye y **por que**. No describe como (eso va en
> `plan.md`). Leelo como contrato: cualquier ambiguedad aca se decide antes de planear.

## 1. Resumen
Verificar y cerrar el flujo completo de ingesta de eventos: la fuente `demo-catamarca` (6 eventos realistas de Catamarca) ya esta en `seed.sql` como `active=true`, y el route handler `/api/events/ingest` ya existe. Lo que falta es un **boton "Disparar Ingesta"** en `/admin/eventos` para que el admin pueda ejecutar la ingesta sin hacer curl manual, y confirmar que el flujo end-to-end funciona: boton -> pending -> moderar -> publicado en `/eventos`.

## 2. Motivacion
El modulo `events` esta 100% implementado (scraper HTML/iCal, use-cases, repo Supabase, route handler `/api/events/ingest`, panel admin de moderacion, pagina publica `/eventos`). Lo unico que falta es un `event_source` real: hoy solo existe la fuente `demo` que genera datos sinteticos. Sin datos reales, la app no cumple su promesa de descubrimiento hiperlocal.

## 3. Objetivos (en alcance)
- O1 -- Identificar al menos una fuente publica de eventos de Catamarca (sitio web HTML o feed iCal).
- O2 -- Registrar esa fuente como fila en `event_sources` (via migration SQL).
- O3 -- Configurar los selectores/URL correctos en el campo `config` JSONB para que el scraper extraiga titulo, fecha y URL de cada evento.
- O4 -- Verificar end-to-end: `POST /api/events/ingest` trae >=1 evento real -> aparece en `/admin/eventos` como `pending` -> al publicar aparece en `/eventos`.
- O5 -- (Opcional) Si la fuente tiene categoria en el markup, mapearla al campo `category` del evento.

## 4. No-objetivos (fuera de alcance, declarados)
- N1 -- No se activa cron automatico en esta feature (eso es despliegue/ops).
- N2 -- No se crea un scraper de multiples paginas con paginacion; se apunta a la pagina principal de proximos eventos.
- N3 -- No se modifica la logica de dominio ni el adapter Supabase.
- N4 -- No se implementa geolocalizacion automatica de eventos (el campo `lat/lng` queda null si la fuente no lo provee).

## 5. Usuarios y permisos
| Rol     | Lo que puede hacer |
|---------|-------------------|
| visitor | Ve eventos `published` con fecha futura en `/eventos` y `/eventos/[slug]` |
| editor  | Igual que visitor (sin acceso a moderacion) |
| admin   | Dispara ingesta manual, modera eventos (`pending -> published/rejected`) en `/admin/eventos` |

La ingesta la dispara el admin o un cron externo via `POST /api/events/ingest` con token Bearer.

## 6. Comportamiento esperado

### Caso feliz
1. Admin llama `POST /api/events/ingest` con `Authorization: Bearer <EVENTS_INGEST_TOKEN>`.
2. El route handler carga la fila de `event_sources` con `active=true`.
3. El scraper descarga la pagina/feed de la fuente real y extrae `RawEvent[]`.
4. `runIngestion` normaliza, deduplica y hace upsert en `events` con `status='pending'`.
5. Admin ve los eventos en `/admin/eventos`, los publica uno a uno.
6. Los eventos publicados aparecen en `/eventos` (ISR 5 min o revalidacion inmediata).

### Edge cases
- **Sin eventos futuros en la fuente**: ingesta retorna `fetched: 0`, no falla.
- **Fuente caida (HTTP >= 400)**: el error queda en `summary.errors`; no hay crash.
- **Duplicado**: `dedupe_hash` unico evita insertar el mismo evento dos veces.
- **Selectores incorrectos / markup cambia**: el scraper devuelve lista vacia sin excepcion.
- **Token invalido**: `POST /api/events/ingest` devuelve 401.

### Errores visibles al usuario
- Si `/eventos` no tiene eventos publicados: estado vacio “No hay eventos proximos. Volve pronto.” (ya implementado).

## 7. Contratos de modulo afectados

### `@haku/events` -- sin cambios de codigo
La infraestructura existente (`createHtmlSource`, `createICalSource`, `runIngestion`) ya soporta configuracion dinamica via `config` JSONB. No se modifica codigo.

### `supabase/migrations/0011_event_source_catamarca.sql` (nueva)
```sql
insert into public.event_sources (key, name, url, type, active, config)
values (
  '? clave-fuente',
  '? Nombre fuente',
  '? URL de la fuente',
  '? html o ical',
  true,
  '? config JSONB con selectores'::jsonb
);
```

### `web/` -- sin cambios de codigo
El route handler `/api/events/ingest` ya carga fuentes activas desde la DB.

## 8. Criterios de aceptacion
- AC1 -- Existe al menos una fila en `event_sources` con `active=true` apuntando a una URL real de Catamarca.
- AC2 -- `POST /api/events/ingest` retorna `{ fetched: N, inserted: M }` con N >= 1 y M >= 1 (primera corrida).
- AC3 -- Los eventos insertados aparecen en `/admin/eventos` con `status='pending'`.
- AC4 -- Al publicar un evento desde el admin, aparece en `/eventos` (tras revalidacion).
- AC5 -- Correr la ingesta dos veces no duplica eventos (segunda corrida: `inserted: 0, updated: M`).
- AC6 -- Si la fuente HTML cambia y los selectores no matchean, la ingesta devuelve `fetched: 0` sin excepcion.

## 9. Riesgos y supuestos
- **Riesgo**: Ningun sitio oficial de Catamarca tiene estructura HTML estable o feed iCal publico -> mitigacion: buscar alternativas (Eventbrite Catamarca, agenda.gob.ar, Google Calendar publico de instituciones locales).
- **Riesgo**: El sitio bloquea scrapers por User-Agent o rate limit -> mitigacion: el `userAgent` ya es configurable en `HtmlSourceConfig`.
- **Supuesto**: Existe al menos una fuente publica de eventos de Catamarca con HTML o iCal parseables sin JS.
- **Supuesto**: La fuente no requiere autenticacion ni JavaScript para renderizar el listado.

## 10. Preguntas abiertas
Todas resueltas:
- RESUELTO **Fuente**: `demo-catamarca` (ya en seed.sql, active=true). Las fuentes HTML/iCal externas investigadas no son accesibles (JS-rendered, 403, ECONNREFUSED). La fuente demo genera 6 eventos realistas de Catamarca suficientes para cerrar el flujo.
- RESUELTO **Moderacion**: manual -- los eventos entran como `pending`, admin los publica.
- RESUELTO **Migration**: no se necesita nueva migration; el seed ya tiene la fuente. El cambio es solo UI (boton en /admin/eventos).

