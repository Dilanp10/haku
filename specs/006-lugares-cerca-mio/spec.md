# Feature Spec — Lugares Cerca Mío

> Estado: **en implementación** (Fase 5 — geolocalización + búsqueda por cercanía).

## 1. Resumen
Página `/lugares/cerca` que muestra los venues publicados más cercanos a la
ubicación del usuario, ordenados por distancia. Encarna el "Haku/vamos" del producto.

## 2. Motivación
- Activa `searchVenuesNearby` de `@haku/core` (ya construido pero sin UI).
- La promesa central del producto es "qué hay cerca tuyo en Catamarca"; sin
  geolocalización esa promesa queda a medias.

## 3. Objetivos
- O1 — `/lugares/cerca` (RSC) lee `?lat=&lng=` y muestra venues ordenados por
  distancia, con la distancia en metros/km visible en cada tarjeta.
- O2 — Sin lat/lng en URL, la página invita a permitir la ubicación con un
  botón que usa `navigator.geolocation` y reescribe la URL.
- O3 — Mapa Leaflet con el pin del usuario + los venues cercanos.
- O4 — Fallback claro si el usuario deniega la geolocalización (link a `/lugares`
  general).

## 4. No-objetivos
- N1 — Búsqueda continua / "live tracking" — solo un fix puntual al cargar.
- N2 — Slider de radio en la UI (default fijo 5 km; configurable más adelante).
- N3 — Buscar eventos cercanos (queda en backlog; mismo patrón se aplica).
- N4 — Compartir ubicación con otros usuarios.

## 5. Usuarios y permisos
| Rol     | Puede |
|---------|-------|
| visitor | abrir `/lugares/cerca` y ver venues `published` cerca suyo (RLS pública). |

## 6. Comportamiento esperado
- Caso feliz:
  1. Usuario abre `/lugares/cerca` → ve botón "Usar mi ubicación".
  2. Click → browser pide permiso → otorgado → coords disponibles.
  3. Client component hace `router.push('/lugares/cerca?lat=…&lng=…')`.
  4. RSC consulta `searchVenuesNearby` y renderiza lista + mapa.
- Sin venues en el radio: mensaje vacío con link a `/lugares`.
- Geolocalización denegada: mensaje inline + link de fallback.
- URL compartible: `/lugares/cerca?lat=…&lng=…` siempre renderiza el mismo resultado.

## 7. Contratos de módulo
- Se usa `@haku/core.searchVenuesNearby(repo, { point, radiusKm, limit })` (existe).
- Se usa `@haku/core.distanceKm(a, b)` para mostrar distancia en UI (existe).
- Sin cambios en ports, adapters ni en otros módulos.

## 8. Criterios de aceptación
- AC1 — `pnpm lint && pnpm -r typecheck && pnpm -r test` ✅.
- AC2 — Test nuevo del use-case `searchVenuesNearby` (3 casos).
- AC3 — Visitor sin sesión ve solo venues `published` (RLS).
- AC4 — Coords inválidas en URL → `ValidationError` del use-case visible en UI.
- AC5 — Mapa renderiza pin del usuario distinguible de los pins de venues.
- AC6 — Frontera modular respetada (ESLint enforça `no-restricted-imports`).

## 9. Riesgos
- En localhost sin HTTPS, algunos browsers exigen HTTPS para geolocalización;
  el dev server de Next acepta http en localhost. Documentar.
- Sin PostGIS, la búsqueda usa bounding-box + haversine en app — adecuada para
  escala Catamarca, no para escala global.

## 10. Decisiones (resueltas)
- Radio default = 5 km, límite default = 30 venues. No configurables en UI todavía.
- URL como fuente de verdad (`?lat&lng`) → RSC-first, compartible, sin estado cliente.
- Pin del usuario con marker estándar de Leaflet + popup "Estás acá"; venues con el
  mismo estilo pero popup con link al detalle.
