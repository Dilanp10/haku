# Plan — Lugares Cerca Mío

## 1. Arquitectura afectada
- `@haku/core`: nada (todo el contrato necesario ya existe).
- `@haku/web`: nueva ruta `/lugares/cerca` + un client component `LocateMe`.
- Tests: agregar uno para `searchVenuesNearby` (no existía).
- Sin migraciones SQL.

## 2. Modelo de datos
Sin cambios.

## 3. Ports y use-cases
Solo se consumen los existentes:
```ts
searchVenuesNearby(repo, { point: { lat, lng }, radiusKm, limit })
distanceKm(a, b)
```

## 4. Infraestructura
Sin cambios. `createSupabaseCoreRepository` se ensambla en la RSC con el cliente
Supabase del request, como en `/lugares`.

## 5. UI / Server Actions
- `/lugares/cerca/page.tsx` (RSC, **dynamic** porque depende de searchParams):
  - Lee `searchParams.lat / lng`.
  - Si faltan → renderiza un client component `<LocateMe>` con CTA.
  - Si están → `searchVenuesNearby` → grid + mapa.
- `web/components/locate-me.tsx` (client):
  - Llama `navigator.geolocation.getCurrentPosition()`.
  - Éxito → `router.push('/lugares/cerca?lat=…&lng=…')`.
  - Error (denegado, no soportado, timeout) → mensaje inline + link a `/lugares`.
- `web/components/venue-map.tsx`:
  - Ya soporta `markers[]` genérico. Para distinguir al usuario, le pasamos un
    `title: 'Estás acá'` y un `href` opcional (los venues tienen href; el usuario no).

## 6. Tests
- `core/src/application/use-cases/search-venues-nearby.use-case.test.ts`:
  - lat fuera de rango → `ValidationError`.
  - radius negativo → `ValidationError`.
  - happy path con fake repo → propaga la lista.

## 7. Riesgos
- ISR no aplica (la página es per-request con coords). Usar `dynamic = 'force-dynamic'`.
- `navigator.geolocation` solo existe en cliente y requiere user gesture + permiso.

## 8. Orden
1. Test `searchVenuesNearby`.
2. Componente client `LocateMe`.
3. Página `/lugares/cerca`.
4. CTA en `/lugares` apuntando a `/lugares/cerca`.
5. Lint + typecheck + tests.
