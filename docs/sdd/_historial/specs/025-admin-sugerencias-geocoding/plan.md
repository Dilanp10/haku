# Plan — Revisión admin de sugerencias + geocoding

> **Cómo** lo construimos. Backfill: documenta lo implementado.

## 1. Arquitectura afectada
Solo `web/` (Server Actions admin + UI). Reusa `updateVenue` de `@haku/core`. Servicio
externo Nominatim (fetch server-side). Sin cambios en `shared`/`auth`/`events`.

## 2. Modelo de datos
Sin tablas nuevas. Escribe en `venue_hours` (materialización) y `venues.location`
(geocoding); limpia claves `_hours`/`_audio_url` de `venues.attributes`.

## 3. Diseño de dominio, ports y use-cases
Sin ports nuevos. `geocodeVenueAction` usa `updateVenue(repo, { id, location })`. La
materialización de horarios es acceso directo a `venue_hours` desde la SA admin
(escritura admin, patrón ya usado en spec 016).

## 4. Diseño de infraestructura
### Nominatim (Server Action)
```ts
const query = /catamarca/i.test(address) ? address
  : `${address}, San Fernando del Valle de Catamarca, Argentina`;
const url = "https://nominatim.openstreetmap.org/search?format=json&limit=1&countrycodes=ar&q="
  + encodeURIComponent(query);
await fetch(url, { headers: { "User-Agent": "Haku/1.0 (…; admin@haku.app)", "Accept-Language": "es" }, cache: "no-store" });
```
Toma `[0].lat/.lon`, valida finitos, `updateVenue(location)`.

### Materialización de horarios
```ts
await supabase.from("venue_hours").delete().eq("venue_id", venueId);
await supabase.from("venue_hours").insert(rows); // rows = attributes._hours filtrados por regex HH:MM
// luego: update venues set attributes = attributes sin _hours/_audio_url
```

## 5. UI / Server Actions (`web`)
| Archivo | Rol |
|---|---|
| `admin/lugares/actions.ts` | `approveSuggestedHoursAction`, `dismissSuggestionMetaAction`, `geocodeVenueAction` |
| `admin/lugares/suggestion-review.tsx` | Client: audio + horarios sugeridos + botones |
| `admin/lugares/geocode-btn.tsx` | Client: dispara geocoding, muestra resultado |
| `admin/lugares/[slug]/page.tsx` | Monta panel de revisión, tarjeta horarios cargados, botón geocode |
| `admin/lugares/page.tsx` | Badge "Sugerencia" en la lista |

### Autorización
Cada acción: `await requireProfile("admin")` al inicio.

## 6. Estrategia de tests
Sin use-cases nuevos. Gate: `pnpm -r typecheck`. Verificación manual: aprobar horarios de
un draft de prueba y confirmar filas en `venue_hours`; geocodificar una dirección conocida.

## 7. Riesgos del plan
| Riesgo | Mitigación |
|---|---|
| Nominatim rate-limit (1 req/s) | Uso on-demand admin, 1 request por click; User-Agent identificable |
| Dirección ambigua → coords erradas | Sesgo Catamarca; el admin verifica en el mapa antes de publicar |
| INSERT parcial de horarios si falla | Reemplazo completo (delete+insert); el admin puede reintentar |

## 8. Orden de implementación
```
T1 [B] actions.ts: approveSuggestedHoursAction + dismissSuggestionMetaAction
T2 [B] actions.ts: geocodeVenueAction (Nominatim)
   ↓
T3 [P] suggestion-review.tsx + geocode-btn.tsx
T4 [B] [slug]/page.tsx: panel + tarjeta horarios + botón geocode
T5 [P] lista admin: badge "Sugerencia"
```
