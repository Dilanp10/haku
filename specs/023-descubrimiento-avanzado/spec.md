# Feature Spec — Descubrimiento avanzado (filtros múltiples, abierto ahora, cercanía)

> Documento de **qué** se construye y **por qué**. No describe cómo (eso va en
> `plan.md`). Léelo como contrato: cualquier ambigüedad acá se decide antes de planear.
>
> **Nota de backfill:** esta feature se implementó y deployó antes de escribir su spec
> (deuda de SDD reconocida). Este documento la formaliza retroactivamente y registra las
> decisiones que **evolucionan** specs previas (ver §11).

## 1. Resumen
El descubrimiento de lugares pasa de filtros de selección única a una experiencia de
filtrado **múltiple, instantánea y sin recarga**, con el estado **"Abierto ahora"** como
señal principal, filtros por **servicios** (WiFi, terraza, etc.), **barrio**, y ordenamiento
**por cercanía** cuando el usuario comparte su ubicación. La home adopta el patrón de
carrusel horizontal de filtros (estilo Morficat) con el estado abierto/cerrado visible en
cada card.

## 2. Motivación
- El filtro de una sola categoría/precio a la vez era limitante: el usuario real piensa
  "cafeterías **o** bares, baratos, abiertos ahora, con wifi".
- "¿Qué está abierto ahora?" es la pregunta central de una app de descubrimiento hiperlocal.
- Ordenar por cercanía es la señal más útil cuando el usuario ya está en la calle.

## 3. Objetivos (en alcance)
- **O1 — Filtros multi-select** en `ListVenuesQuery`: `categorySlugs[]`, `foodTypeSlugs[]`,
  `priceRanges[]`. Se mantienen los singulares (`categorySlug`, etc.) por compatibilidad.
- **O2 — Filtro `openNow`**: booleano que restringe a venues abiertos en el momento de la
  consulta, según la hora de **Catamarca** (no la del browser).
- **O3 — Filtro por `attributes`** (servicios): array de claves que deben ser `true` en la
  columna `venues.attributes` (jsonb). Ej: `["wifi","terraza"]`.
- **O4 — Estado abierto/cerrado por venue**: función de dominio pura que, dados los horarios
  y un instante, determina si está abierto y a qué hora cierra. Soporta **múltiples rangos
  por día** y **cruce de medianoche**.
- **O5 — Campo `neighborhood`** en `venues`, mostrado en las cards y el mapa.
- **O6 — Orden por cercanía**: cuando la URL trae `?lat&lng`, las páginas de listado ordenan
  los venues por distancia ascendente y muestran la distancia (km/m) en cada card.
- **O7 — UI de filtros en carrusel** (`VenuesFilters`): chips horizontales scrolleables
  (Abierto ahora, categorías) + panel expandible con servicios, food types y precio.
  Selección client-side que sincroniza la URL sin recarga completa.
- **O8 — Indicador visual de estado** en la card: punto verde "Abierto · cierra a las HH:MM"
  o punto rojo "Cerrado".

## 4. No-objetivos (fuera de alcance, declarados)
- N1 — Geocodificación de direcciones (se cubre en spec 025).
- N2 — Wizard de sugerencia de lugares (spec 024).
- N3 — Búsqueda por texto rediseñada en `/buscar` (spec 026).
- N4 — Horarios especiales por fecha (feriados/temporadas).
- N5 — Radio de cercanía configurable por el usuario (se ordena por distancia, sin recorte
  de radio en el listado general).
- N6 — Persistir la ubicación del usuario entre sesiones (vive solo en la URL).

## 5. Usuarios y permisos
| Rol      | Lo que puede hacer                                                          |
|----------|----------------------------------------------------------------------------|
| visitor  | Filtrar (multi), ver estado abierto/cerrado, compartir ubicación y ordenar por cercanía. |
| editor   | Igual que visitor en la parte pública.                                      |
| admin    | Igual; además carga `attributes` y `neighborhood` desde el form de edición. |

## 6. Comportamiento esperado

### Caso feliz — filtrado múltiple
1. El usuario abre la home o `/lugares`.
2. Toca varios chips (ej. "Cafetería" + "Bar") y abre el panel para marcar "WiFi".
3. La URL pasa a `?categoria=cafeteria,bar&attrs=wifi` **sin recarga completa**
   (`router.replace`, `scroll:false`).
4. El listado se actualiza mostrando venues que cumplen **todos** los grupos de filtro
   (AND entre grupos, OR dentro de un grupo).

### Caso feliz — abierto ahora
1. El usuario toca el chip "Abierto ahora" (punto verde con pulso).
2. La URL agrega `?abierto=1`; el listado muestra solo venues abiertos según la hora de Catamarca.
3. Cada card abierta muestra "● Abierto · cierra a las HH:MM"; las cerradas (con horarios
   cargados) muestran "● Cerrado".

### Caso feliz — cercanía
1. El usuario toca "Activá la ubicación para ver distancias".
2. El browser pide permiso; al aceptarse, la URL agrega `?lat&lng`.
3. El listado se reordena por distancia ascendente y cada card muestra la distancia (m/km).
4. Un banner confirma "Ubicación activa · ordenado por cercanía" con opción de quitarla.

### Edge cases
- Venue **sin filas** en `venue_hours` → no muestra estado (ni abierto ni cerrado).
- Rango que **cruza medianoche** (ej. 21:00–05:00) → se considera abierto si la hora actual
  es ≥ apertura **o** ≤ cierre.
- **Múltiples rangos** el mismo día (09:00–13:00 y 17:00–23:00) → abierto si cae en cualquiera.
- Permiso de ubicación **denegado** → se mantiene el orden por defecto; el banner explica cómo
  reactivarlo (no puede reabrir el prompt nativo, es restricción del browser).
- Filtro que no matchea nada → estado vacío con link para limpiar filtros.

## 7. Contratos de módulo afectados

### `@haku/core` — puerto `ListVenuesQuery` (`application/ports/core-repository.port.ts`)
```ts
export interface ListVenuesQuery {
  categorySlug?: string;
  categorySlugs?: string[];      // nuevo
  foodTypeSlug?: string;
  foodTypeSlugs?: string[];      // nuevo
  priceRange?: PriceRange;
  priceRanges?: PriceRange[];    // nuevo
  search?: string;
  status?: "draft" | "published" | "archived";
  openNow?: boolean;             // nuevo
  attributes?: string[];         // nuevo — claves que deben ser true en venues.attributes
  pagination: Pagination;
}
```

### `@haku/core` — dominio `Venue` (`domain/venue.ts`)
```ts
export interface Venue {
  // …campos existentes…
  neighborhood?: string | null;         // nuevo
  attributes?: Record<string, boolean>; // nuevo
}
```

### `@haku/core` — **función de dominio pura** (Principio III)
Nueva función en `domain/` que decide el estado sin conocer Supabase ni la hora del sistema:
```ts
export interface OpeningRange { day: number; opensAt: string; closesAt: string } // "HH:MM"
export interface OpenState { open: boolean; closesAt?: string }
/** Determina si un venue está abierto en `now` (día+hora), soportando cruce de medianoche. */
export function openStateAt(ranges: OpeningRange[], now: Date): OpenState;
```
> **Corrige hallazgo de constitución III:** hoy la lógica vive en `web/lib/venue-open-now.ts`
> y duplicada en el repo. Debe centralizarse acá y ser consumida por ambos.

### `@haku/shared` — `database.ts`
Agregar a `venues.Row`/`Insert`: `attributes: Record<string, boolean>` y `neighborhood: string | null`.

### Base de datos — migración
```sql
ALTER TABLE public.venues ADD COLUMN IF NOT EXISTS attributes jsonb NOT NULL DEFAULT '{}'::jsonb;
ALTER TABLE public.venues ADD COLUMN IF NOT EXISTS neighborhood text;
CREATE INDEX IF NOT EXISTS idx_venues_attributes ON public.venues USING gin (attributes);

-- Habilita múltiples rangos por día (evoluciona spec 016):
ALTER TABLE public.venue_hours DROP CONSTRAINT IF EXISTS venue_hours_venue_id_day_of_week_key;
CREATE INDEX IF NOT EXISTS idx_venue_hours_venue_day ON public.venue_hours (venue_id, day_of_week);
```

### Web (composition root)
- `web/components/venues-filters.tsx` — filtros carrusel + panel, client, sincroniza URL.
- `web/components/venue-card.tsx` / `event-card.tsx` — estado abierto/cerrado + distancia.
- `web/components/locate-me-inline.tsx` — activa geolocalización → `?lat&lng`.
- `web/lib/venue-open-now.ts` — **adapter fino**: consulta `venue_hours` y delega el cálculo
  en `openStateAt` de `@haku/core` (no reimplementa la lógica).
- `web/app/(site)/page.tsx`, `/lugares/page.tsx`, `/eventos/page.tsx` — parsean filtros multi,
  ordenan por cercanía, pasan a `force-dynamic`.

## 8. Criterios de aceptación
- AC1 — Se pueden seleccionar varias categorías, precios y food types a la vez; el resultado
  respeta AND entre grupos / OR dentro del grupo.
- AC2 — El filtro "Abierto ahora" devuelve solo venues abiertos según hora de Catamarca.
- AC3 — El estado abierto/cerrado se calcula con `openStateAt` (dominio), con tests que cubren:
  rango simple, cruce de medianoche, múltiples rangos, sin horarios.
- AC4 — Con `?lat&lng`, el listado se ordena por distancia y cada card muestra m/km.
- AC5 — El filtrado actualiza la URL sin recarga completa ni salto de scroll.
- AC6 — `attributes` y `neighborhood` se muestran donde corresponde (card, mapa).
- AC7 — `pnpm -r typecheck` y `pnpm -r test` pasan.

## 9. Riesgos y supuestos
- **ISR → dynamic (Principio VII):** las páginas de listado dependen de `searchParams`
  (filtros, lat/lng) y de la hora actual ("abierto ahora"), por lo que no se pueden cachear
  estáticamente. Se acepta `force-dynamic` como trade-off consciente y documentado.
- **Timezone fija:** el estado "abierto ahora" usa `America/Argentina/Catamarca` (no el TZ del
  browser). Evoluciona la decisión N3 de spec 016. Supuesto: todos los venues son de Catamarca.
- **Tipado de `attributes` (Principio V):** se tipa `Record<string, boolean>`. La metadata del
  wizard (`_hours`, `_audio_url`) que NO es booleana se aborda en spec 024, no acá.

## 10. Preguntas abiertas
_(ninguna — la feature ya está en producción; este spec la formaliza.)_

## 11. Specs que esta feature evoluciona
- **016 — venue-opening-hours:** se levantan sus no-objetivos **N1** (múltiples turnos por día)
  y **N3** (timezone), y su edge-case de cruce de medianoche pasa a estar **en alcance**. Se
  elimina el `UNIQUE (venue_id, day_of_week)` que declaraba. El badge abierto/cerrado se
  recalcula server-side con TZ Catamarca y se muestra también en las cards del listado (levanta
  su N4).
- **006 — lugares-cerca-mio:** el orden por cercanía deja de ser una página aparte
  (`/lugares/cerca`) y se integra inline en los listados vía `?lat&lng`; la página vieja
  redirige. La distancia se muestra en cada card.
