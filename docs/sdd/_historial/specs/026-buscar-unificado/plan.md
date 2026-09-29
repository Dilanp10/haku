# Plan — Búsqueda unificada (`/buscar`)

> **Cómo** lo construimos. Feature nueva; se implementa tras aprobar esta spec.

## 1. Arquitectura afectada
Solo `web/app/(site)/buscar/page.tsx`. Reusa componentes y utils existentes
(`VenueCard`, `EventCard`, `getVenueStatuses`, `listVenues`, `listUpcomingEvents`).
Sin cambios en `core`/`events`/`shared`.

## 2. Modelo de datos
Sin cambios.

## 3. Diseño de dominio, ports y use-cases
Sin ports ni use-cases nuevos. Se usa `listVenues({ search })` y
`listUpcomingEvents({ search })` ya existentes.

## 4. Diseño de infraestructura
Cuando hay `q`, además de las búsquedas se llama `getVenueStatuses(supabase)` (una sola vez)
para saber qué lugares están abiertos y a qué hora cierran. Se pasa a cada `<VenueCard>`.

## 5. UI / Server Actions (`web`)
Reescribir la sección de resultados de `buscar/page.tsx`:
- Lugares: `venues.map(v => <VenueCard venue={v} category={catById.get(v.categoryId)}
  openNow={!!open} closesAt={open?.closesAt} closed={!open && known} />)`.
- Eventos: `events.map(e => <EventCard event={e} />)`.
- Conservar header, `SearchInput`, conteo, empty-state, secciones "Lugares"/"Eventos"
  con su link "Ver todos".
- Quitar el markup `<li>`/`<Link>` ad-hoc y los imports que dejan de usarse
  (`MapPin`, `CalendarDays`, `fmtDate`) si ya no hacen falta.

## 6. Estrategia de tests
Sin lógica testeable nueva. Gates: `pnpm -r typecheck` + verificación visual (`/buscar?q=cafe`
consistente con `/lugares`). Deploy a producción.

## 7. Riesgos del plan
| Riesgo | Mitigación |
|---|---|
| Query extra de estados cuando hay `q` | Solo se ejecuta con `q` presente; es la misma de `/lugares` |
| `VenueCard` espera props opcionales | Pasar spread condicional para `closesAt` (exactOptionalPropertyTypes) |

## 8. Orden de implementación
```
T1 [B] buscar/page.tsx: agregar getVenueStatuses cuando hay q
T2 [B] buscar/page.tsx: render con VenueCard/EventCard, quitar markup ad-hoc
T3 [B] typecheck + deploy + verificación visual
```
