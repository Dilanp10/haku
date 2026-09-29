# Plan — Eventos Cerca Tuyo (008)

> Spec: [spec.md](./spec.md) — Estado: **en implementación**.

## Enfoque general
Tres áreas de trabajo en orden de dependencia:
1. `events/` — port + use-case + adapter + tests.
2. `supabase/` — migración de índice geo.
3. `web/` — página `/eventos/cerca` + CTA en `/eventos`.

## Pasos

### P1 — Port: agregar `listNearby` a `EventRepository`
Archivo: `events/src/application/ports/event-repository.port.ts`
Agregar al interface:
```ts
listNearby(point: GeoPoint, radiusKm: number, limit: number): Promise<Event[]>
```

### P2 — Use-case: `searchEventsNearby`
Archivo nuevo: `events/src/application/use-cases/search-events-nearby.use-case.ts`
Clonar estructura de `search-venues-nearby.use-case.ts`:
- Schema Zod: `{ point: geoPointSchema, radiusKm: positivo ≤50 default 10, limit: int 1-100 default 20 }`.
- Devuelve `Result<Event[]>`.
- Exportar tipo `SearchEventsNearbyInput`.

### P3 — Test del use-case
Archivo nuevo: `events/src/application/use-cases/search-events-nearby.use-case.test.ts`
3 casos:
1. Happy path: repo fake devuelve 2 eventos → `Result.ok` con 2 eventos.
2. Coords inválidas (`lat: 999`) → `ValidationError`.
3. Sin resultados: repo fake devuelve `[]` → `Result.ok` con array vacío.

### P4 — Adapter: implementar `listNearby`
Archivo: `events/src/infrastructure/supabase-event.repository.ts`
```ts
async listNearby(point, radiusKm, limit) {
  // haversine privada (no importar de @haku/core)
  const dLat = radiusKm / 111;
  const dLng = radiusKm / (111 * Math.cos((point.lat * Math.PI) / 180) || 1);
  const res = await client.from("events")
    .select("*")
    .eq("status", "published")
    .gte("starts_at", new Date().toISOString())
    .gte("lat", point.lat - dLat).lte("lat", point.lat + dLat)
    .gte("lng", point.lng - dLng).lte("lng", point.lng + dLng)
    .limit(limit * 4);
  // filtrar por radio real + ordenar + slice
}
```

### P5 — Exportar desde `events/src/index.ts`
Agregar `searchEventsNearby` y `SearchEventsNearbyInput` al barrel.

### P6 — Migración Supabase
Archivo nuevo: `supabase/migrations/0004_events_geo_index.sql`
```sql
create index events_lat_lng_idx on public.events (lat, lng)
  where lat is not null and lng is not null;
```

### P7 — Página `/eventos/cerca`
Archivo nuevo: `web/app/eventos/cerca/page.tsx`
Estructura idéntica a `/lugares/cerca/page.tsx`:
- `dynamic = "force-dynamic"`, `metadata.robots noindex`.
- Sin coords → `<LocateMe redirectTo="/eventos/cerca" />`.
- Con coords → `searchEventsNearby` + mapa + lista.
- Distancia con `distanceKm` de `@haku/core`.
- Mapa: `VenueMap` con pin usuario + pins de eventos.
- Tarjetas: `EventCard` + distancia arriba.

### P8 — CTA en `/eventos/page.tsx`
Agregar banner/CTA "Cerca tuyo →" con link a `/eventos/cerca` (igual al patrón
de `/lugares/page.tsx` que tiene CTA a `/lugares/cerca`).

### P9 — Actualizar BACKLOG
Marcar feature 008 como ✅ en `BACKLOG.md`.
