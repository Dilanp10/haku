# Cómo agregar una fuente de eventos

Haku soporta tres tipos de fuentes, configurables en la tabla `event_sources`
sin necesidad de cambiar código ni hacer deploy.

## Tipos soportados

| `type`   | Descripción |
|----------|-------------|
| `html`   | Scraper de página HTML. Configurar con selectores CSS en el campo `config`. |
| `ical`   | Feed iCal (`.ics`, RFC 5545 subset). Solo necesita la URL. |
| `api`    | No implementado todavía. |

## Agregar una fuente HTML

1. Abrí Supabase Studio → Table Editor → `event_sources`.
2. Insertá una fila:

```sql
insert into public.event_sources (key, name, url, type, config, active)
values (
  'mi-fuente',
  'Descripción legible',
  'https://misitio.com/agenda',
  'html',
  '{
    "wrapper":         "article.evento",
    "titleSelector":   "h3.titulo",
    "dateSelector":    "time",
    "dateAttr":        "datetime",
    "dateFormat":      "ISO",
    "descSelector":    "p.descripcion",
    "linkSelector":    "a.ver-mas",
    "venueSelector":   ".lugar",
    "addressSelector": ".direccion",
    "imageSelector":   "img.cover",
    "baseUrl":         "https://misitio.com"
  }',
  true
);
```

### Campos de `config`

| Campo | Obligatorio | Descripción |
|-------|-------------|-------------|
| `wrapper` | ✅ | Selector CSS del contenedor de cada evento |
| `titleSelector` | ✅ | Selector del título |
| `dateSelector` | ✅ | Selector del elemento de fecha |
| `dateAttr` | — | Atributo del que leer la fecha (ej. `"datetime"`); si falta, usa el texto del nodo |
| `dateFormat` | — | `"ISO"` (default) o `"AR"` (DD/MM/YYYY HH:mm, asume UTC-3) |
| `descSelector` | — | Selector de la descripción |
| `linkSelector` | — | Selector del enlace al detalle |
| `venueSelector` | — | Selector del nombre del lugar |
| `addressSelector` | — | Selector de la dirección |
| `imageSelector` | — | Selector de la imagen de portada |
| `imageAttr` | — | Atributo de la imagen (default: `"src"`) |
| `baseUrl` | — | Prefijo para URLs relativas (ej. `"https://misitio.com"`) |

## Agregar una fuente iCal

```sql
insert into public.event_sources (key, name, url, type, config, active)
values (
  'mi-calendario',
  'Calendario Cultural',
  'https://misitio.com/eventos.ics',
  'ical',
  '{}',
  true
);
```

El parser iCal extrae: `SUMMARY` → título, `DTSTART`/`DTEND`, `DESCRIPTION`,
`LOCATION` (primera parte → nombre del lugar, resto → dirección), `URL`, `GEO`
(lat;lng).

Para fechas sin zona horaria explícita, el parser asume **America/Argentina/Catamarca (UTC-3)**.

## Disparar la ingesta manualmente

```bash
curl -X POST https://tu-app.vercel.app/api/events/ingest \
  -H "Authorization: Bearer $EVENTS_INGEST_TOKEN"

# Una sola fuente:
curl -X POST ".../api/events/ingest?source=mi-fuente" \
  -H "Authorization: Bearer $EVENTS_INGEST_TOKEN"
```

## Flujo completo

1. Los eventos ingestados quedan en estado `pending`.
2. Un admin entra a `/admin/eventos` y los publica o rechaza.
3. Los eventos `published` y futuros aparecen en `/eventos` (revalidación ISR).

## Desactivar una fuente rota

```sql
update public.event_sources set active = false where key = 'mi-fuente';
```
