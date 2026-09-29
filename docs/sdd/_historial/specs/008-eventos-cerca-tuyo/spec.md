# Feature Spec — Eventos Cerca Tuyo

> Estado: **aprobada** — listo para implementar.

## 1. Resumen
Página `/eventos/cerca` que muestra los eventos publicados más cercanos a la
ubicación del usuario, ordenados por distancia y limitados a eventos futuros.
Es el espejo de `/lugares/cerca` pero para el módulo Events.

## 2. Motivación
- Activa la dimensión geográfica de los eventos: ya existen `lat`/`lng` en
  la tabla `events`, pero no hay UI que los aproveche.
- Completa la promesa del producto: "qué está pasando cerca tuyo en Catamarca".
- Patrón probado: reutiliza `LocateMe`, `VenueMap`, `distanceKm` ya en producción.

## 3. Objetivos
- O1 — `/eventos/cerca` (RSC, force-dynamic) lee `?lat=&lng=` y muestra eventos
  `published` y futuros ordenados por distancia, con la distancia visible.
- O2 — Sin coordenadas en URL: muestra `LocateMe` con `redirectTo="/eventos/cerca"`.
- O3 — Mapa Leaflet con pin del usuario + pin por evento con link a `/eventos/[slug]`.
- O4 — Fallback si el usuario deniega geolocalización (link a `/eventos` general).

## 4. No-objetivos
- N1 — Live-tracking de la posición (solo fix puntual al cargar).
- N2 — Radio configurable en UI (default fijo 10 km; eventos están más dispersos que venues).
- N3 — Filtros de categoría en `/eventos/cerca` (backlog).
- N4 — Eventos sin coordenadas aparecen en la lista general `/eventos`, no aquí.

## 5. Usuarios y permisos
| Rol     | Puede |
|---------|-------|
| visitor | ver `/eventos/cerca` con eventos `published` y futuros (RLS pública). |

## 6. Comportamiento esperado
- Caso feliz:
  1. Usuario abre `/eventos/cerca` sin coords → `LocateMe`.
  2. Permite ubicación → `router.push('/eventos/cerca?lat=…&lng=…')`.
  3. RSC llama `searchEventsNearby` → lista + mapa.
- Sin eventos en radio (10 km): mensaje vacío + link a `/eventos`.
- Error de validación (coords inválidas en URL): mensaje de error.
- `noindex` en metadata (dato personal de ubicación).

## 7. Contratos de módulo

### 7.1 Events — cambios necesarios
- **Port** `EventRepository`: agregar método
  ```ts
  listNearby(point: GeoPoint, radiusKm: number, limit: number): Promise<Event[]>
  ```
- **Use-case** nuevo: `searchEventsNearby(repo, { point, radiusKm?, limit? })`
  devuelve `Result<Event[]>` con validación Zod (igual que `searchVenuesNearby`).
- **Adapter** `SupabaseEventRepository`: implementar `listNearby` con bounding-box SQL
  + haversine en app layer (patrón idéntico al de `supabase-core.repository.ts`).
- Haversine inline en el adapter (función privada, no importar de `@haku/core` —
  frontera modular).

### 7.2 Web — cambios necesarios
- `/eventos/cerca/page.tsx`: RSC force-dynamic, noindex, mismo esqueleto que
  `/lugares/cerca`.
- Usa `@haku/events.searchEventsNearby` + `@haku/core.distanceKm` (composition root,
  legal importar de ambos).
- Usa `VenueMap` existente para el mapa (componente genérico de marcadores).
- Usa `EventCard` existente para las tarjetas.
- Actualizar `/eventos/page.tsx`: agregar CTA "Cerca tuyo →".

### 7.3 Supabase — migración
- `supabase/migrations/0004_events_geo_index.sql`: índice compuesto `(lat, lng)` en
  `events` para acelerar las consultas de bounding-box.

## 8. Criterios de aceptación
- AC1 — `pnpm lint && pnpm -r typecheck && pnpm -r test` ✅.
- AC2 — Test `searchEventsNearby`: happy path, coords inválidas, sin resultados (3 casos).
- AC3 — Visitor sin sesión ve solo eventos `published` y futuros (RLS).
- AC4 — Coords inválidas en URL → `ValidationError` visible en UI.
- AC5 — Mapa renderiza pin del usuario + pins de eventos con link al detalle.
- AC6 — CTA "Cerca tuyo" en `/eventos` redirige a `/eventos/cerca`.
- AC7 — Frontera modular: `events/` no importa de `@haku/core`.

## 9. Riesgos
- Eventos del `DemoEventSource` no tienen `location` → no aparecen en `/eventos/cerca`.
  Esto es correcto y esperado; la página mostrará "sin resultados" en dev.
- Sin PostGIS, bounding-box + haversine es adecuado para escala Catamarca.

## 10. Decisiones (resueltas)
- Radio default = **10 km** (eventos más dispersos geográficamente que venues).
- Límite = 20 eventos cercanos.
- Haversine duplicado en adapter events (≈3 líneas): aceptable vs. violar frontera modular.
- `VenueMap` se usa para ambos (venues y eventos) — es un componente de marcadores
  genérico, no de venues específicamente. Renombrarlo queda en backlog.
