# Feature Spec — Scraper Sources (HTML + iCal)

> Estado: **aprobada** — listo para implementar.

## 1. Resumen
Dos adaptadores de fuentes de eventos production-ready:
1. **HtmlSource** — scraper configurable por CSS selectors (config JSONB en DB).
2. **ICalSource** — parser de feeds `.ics` (RFC 5545 subset).

Ambos se activan cambiando `type`/`config` en `event_sources` sin deploy.

## 2. Motivación
- La spec de events (O1) exigía "al menos un scraper concreto de Catamarca".
- `HtmlSource` actual es un stub que devuelve `[]`.
- `event_source_type` ya prevé `'ical'` pero no tiene implementación.
- Con estos dos adaptadores, el admin puede conectar cualquier fuente real
  configurando selectores o una URL de calendario sin tocar código.

## 3. Objetivos
- O1 — `HtmlSource` completo: config JSONB con selectores CSS; parsea título,
  fecha, descripción, venue, imagen, link.
- O2 — `ICalSource`: parsea VEVENT de un feed `.ics`; extrae SUMMARY, DTSTART,
  DTEND, DESCRIPTION, LOCATION, URL, GEO.
- O3 — Sin dependencias nuevas: iCal parser inline; HTML con cheerio (ya instalado).
- O4 — Route handler `/api/events/ingest` maneja el tipo `ical`.
- O5 — `supabase/seed.sql` incluye un source `ical` de ejemplo (placeholder).
- O6 — `docs/adding-a-source.md` documenta cómo agregar una fuente nueva.

## 4. No-objetivos
- N1 — Parser iCal completo (recurrencias RRULE, vtimezone complejo) — solo
  subset de eventos concretos.
- N2 — Autenticación HTTP en las fuentes (scraper público).
- N3 — Tipo `api` (queda en backlog).

## 5. HtmlSourceConfig (JSONB en event_sources.config)
```json
{
  "wrapper":         "article.evento",
  "titleSelector":   "h3.titulo",
  "dateSelector":    "time",
  "dateAttr":        "datetime",
  "dateFormat":      "ISO",
  "descSelector":    "p.descripcion",
  "linkSelector":    "a.mas-info",
  "venueSelector":   ".lugar",
  "addressSelector": ".direccion",
  "imageSelector":   "img",
  "imageAttr":       "src",
  "baseUrl":         "https://catamarca.gob.ar"
}
```
Campos obligatorios: `wrapper`, `titleSelector`, `dateSelector`.
`dateFormat`: `"ISO"` (ISO 8601 en `datetime` attr) o `"DD/MM/YYYY HH:mm"` (texto).

## 6. ICalSource
- Parsea texto `.ics` con mini-parser inline (sin deps).
- Extrae por VEVENT: SUMMARY → title, DTSTART → startsAt, DTEND → endsAt,
  DESCRIPTION, LOCATION → venueName + address, URL, GEO → location `{lat, lng}`.
- Normaliza DTSTART a ISO UTC (detecta `Z`, offset `±HH:MM`, o asume UTC).

## 7. Criterios de aceptación
- AC1 — `pnpm lint && pnpm -r typecheck && pnpm -r test` ✅.
- AC2 — Test `HtmlSource`: HTML fijo con 2 artículos → 2 RawEvents correctos.
- AC3 — Test `ICalSource`: `.ics` fijo con 2 VEVENT → 2 RawEvents correctos.
- AC4 — Route handler activa `ICalSource` cuando `type='ical'`.
- AC5 — Frontera modular mantenida.

## 8. Decisiones
- Sin deps nuevas: iCal parser ~60 líneas inline, cheerio ya está.
- Config en JSONB: el admin puede agregar/editar fuentes desde Supabase Studio
  o SQL sin redeploy.
- `dateFormat: "ISO"` usa `element.attr('datetime')`, `"DD/MM/YYYY HH:mm"` usa
  el texto del nodo con `Date.parse` tras normalizar el formato.
- Zona horaria HTML: si no hay offset explícito → se interpreta como
  `America/Argentina/Catamarca` (UTC-3) y se convierte a UTC.
