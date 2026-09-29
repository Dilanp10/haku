# Plan — Descubrimiento avanzado

> **Cómo** lo construimos. Se escribe DESPUÉS de aprobar `spec.md`.
>
> **Nota de backfill:** el código ya está en producción. Este plan documenta la
> arquitectura tal como quedó y marca el trabajo pendiente que la spec mandata
> (función de dominio `openStateAt`, ver §3).

## 1. Arquitectura afectada
- **`@haku/core`** — puerto `ListVenuesQuery` ampliado; dominio `Venue` con `attributes`
  y `neighborhood`; **nueva función de dominio `openStateAt`**; use-case `listVenues` y
  adapter Supabase soportan los filtros nuevos.
- **`@haku/shared`** — `database.ts`: columnas `attributes`, `neighborhood` en `venues`.
- **`supabase/`** — migración: columnas nuevas + drop del `UNIQUE (venue_id, day_of_week)`.
- **`web/`** — `VenuesFilters`, `LocateMeInline`, cards con estado/distancia, `venue-open-now`
  como adapter fino, páginas de listado con parseo multi + orden por cercanía.
- No se toca `@haku/auth`. `@haku/events` solo consume `distanceKm` de `core` en `web`
  (composition root) — sin acoplamiento directo entre dominios (Principio II ✅).

Sin dependencias npm nuevas.

## 2. Modelo de datos
```sql
ALTER TABLE public.venues ADD COLUMN IF NOT EXISTS attributes jsonb NOT NULL DEFAULT '{}'::jsonb;
ALTER TABLE public.venues ADD COLUMN IF NOT EXISTS neighborhood text;
CREATE INDEX IF NOT EXISTS idx_venues_attributes ON public.venues USING gin (attributes);

-- Evoluciona spec 016: permite múltiples rangos por día.
ALTER TABLE public.venue_hours DROP CONSTRAINT IF EXISTS venue_hours_venue_id_day_of_week_key;
CREATE INDEX IF NOT EXISTS idx_venue_hours_venue_day ON public.venue_hours (venue_id, day_of_week);
```
`attributes` guarda solo flags booleanos de servicios (`wifi`, `terraza`, …). La metadata
del wizard (`_hours`, `_audio_url`) es un uso transitorio que se corrige en spec 024.

## 3. Diseño de dominio, ports y use-cases

### Función de dominio pura (`@haku/core/domain/opening-hours.ts`) — PENDIENTE
> Corrige el hallazgo de constitución III. Hoy la lógica está en `web/lib/venue-open-now.ts`
> y duplicada en el adapter Supabase. Se centraliza en dominio y ambos la consumen.
```ts
export interface OpeningRange { day: number; opensAt: string; closesAt: string } // "HH:MM"[:SS]
export interface OpenState { open: boolean; closesAt?: string }

/** Estado de apertura en `now`. Soporta cruce de medianoche y múltiples rangos por día. */
export function openStateAt(ranges: OpeningRange[], now: Date): OpenState {
  const dow = now.getDay();
  const hhmm = toHHMM(now); // "HH:MM"
  for (const r of ranges) {
    if (r.day !== dow) continue;
    const o = r.opensAt.slice(0, 5), c = r.closesAt.slice(0, 5);
    const open = o <= c ? (hhmm >= o && hhmm <= c) : (hhmm >= o || hhmm <= c);
    if (open) return { open: true, closesAt: c };
  }
  return { open: false };
}
```
> **Nota TZ:** la conversión "ahora en Catamarca" se hace en el borde (web), que le pasa a
> `openStateAt` un `Date` ya en hora local de Catamarca. El dominio queda puro (no conoce TZ).

### Puerto `ListVenuesQuery` — filtros nuevos
`categorySlugs[]`, `foodTypeSlugs[]`, `priceRanges[]`, `openNow`, `attributes[]`.
El use-case `listVenues` valida con Zod y pasa al adapter.

## 4. Diseño de infraestructura

### Adapter Supabase (`listVenues`)
- **Multi-select:** si el array tiene 1 elemento usa `.eq`, si tiene >1 usa `.in`.
- **`attributes`:** `q.contains("attributes", { wifi: true, terraza: true })` (operador `@>` jsonb).
- **`openNow`:** resuelve primero los `venue_id` abiertos consultando `venue_hours` del día y
  filtrando con la lógica de rangos, luego `q.in("id", openIds)`.
- **food types multi:** resuelve slugs→ids con `.in("slug", …)` y filtra el join.

### Adapter web (`web/lib/venue-open-now.ts`) — se vuelve fino
`getVenueStatuses(client)` consulta `venue_hours` (hoy + universo de venues con horario) y
delega el cómputo por venue en `openStateAt` de `@haku/core`. Devuelve
`{ open: Map<id,{closesAt}>, knownIds: Set<id> }`.

### Orden por cercanía (web, RSC)
Las páginas leen `?lat&lng`; si están presentes calculan `distanceKm(user, venue.location)`
(función ya existente en `core`, spec 006) y ordenan ascendente. Con ubicación, `pageSize`
sube a 50 y se desactiva la paginación.

## 5. UI / Server Actions (`web`)

### Nuevos archivos
| Archivo | Tipo | Notas |
|---|---|---|
| `web/components/venues-filters.tsx` | Client | Carrusel de chips + panel; sincroniza URL |
| `web/components/locate-me-inline.tsx` | Client | Geolocalización → `?lat&lng`; detecta permiso denegado |
| `web/components/card-save-button.tsx` | Client | Corazón guardar dentro de la card |
| `web/lib/venue-open-now.ts` | Server util | Adapter fino sobre `openStateAt` |
| `web/components/haku-map.tsx` | Client | Pins por estado abierto/cerrado (evoluciona) |

### Archivos modificados
| Archivo | Cambio |
|---|---|
| `core/src/application/ports/core-repository.port.ts` | + campos multi/openNow/attributes en `ListVenuesQuery`; + `coverImageUrl` en `CreateVenueData` |
| `core/src/application/use-cases/list-venues.use-case.ts` | + validación Zod de los campos nuevos |
| `core/src/infrastructure/supabase-core.repository.ts` | + filtros multi/attributes/openNow; map de `attributes`/`neighborhood` |
| `core/src/domain/venue.ts` | + `attributes?`, `neighborhood?` |
| `shared/src/types/database.ts` | + columnas en `venues` |
| `web/components/venue-card.tsx`, `event-card.tsx` | + estado abierto/cerrado, distancia, barrio |
| `web/app/(site)/page.tsx`, `/lugares/page.tsx`, `/eventos/page.tsx` | parseo multi, orden cercanía, `force-dynamic` |
| `web/app/(site)/mapa/page.tsx` | estado por pin |
| `web/app/(site)/lugares/cerca/page.tsx`, `/eventos/cerca/page.tsx` | redirect a listado con `?lat&lng` |

### Autorización / RLS
- Lectura pública ya cubierta por `venues_read_published` y `venue_hours_public_select`.
- Escritura de `attributes`/`neighborhood`: solo admin (`venues_admin_all`), desde el form de edición.

## 6. Estrategia de tests
- **Nuevo:** `core/src/domain/opening-hours.test.ts` cubre `openStateAt`:
  rango simple (dentro/fuera), cruce de medianoche, múltiples rangos el mismo día, sin rangos.
- Los tests de `listVenues` existentes siguen pasando (los campos nuevos son opcionales).
- Gates: `pnpm -r typecheck` + `pnpm -r test`.

## 7. Riesgos del plan
| Riesgo | Mitigación |
|---|---|
| Duplicación de la lógica open-now (constitución III) | Centralizar en `openStateAt`; `web` y adapter la consumen |
| `force-dynamic` sacrifica ISR en listados | Aceptado: dependen de searchParams + hora actual (spec §9) |
| `pageSize` alto con ubicación | Límite 50; el orden por distancia es O(n log n) en memoria, aceptable |
| jsonb `@>` sin índice sería lento | Índice GIN en `attributes` |

## 8. Orden de implementación
```
T1 [B] migración: columnas attributes/neighborhood + drop unique venue_hours
T2 [B] shared/database.ts: columnas en venues
   ↓
T3 [B] core/domain/opening-hours.ts: openStateAt + test
T4 [B] core: ListVenuesQuery + Venue + use-case + adapter (multi/openNow/attributes)
   ↓
T5 [P] web/lib/venue-open-now.ts: adapter fino sobre openStateAt
T6 [P] web/components/venues-filters.tsx + locate-me-inline + card-save-button
T7 [P] web/components/venue-card + event-card + haku-map: estado/distancia
   ↓
T8 [B] páginas de listado: parseo multi + orden cercanía + force-dynamic
T9 [B] redirects de /lugares/cerca y /eventos/cerca
```
