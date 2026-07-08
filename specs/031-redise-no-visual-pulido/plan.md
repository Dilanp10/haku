# Plan — Rediseño visual pulido

> **Cómo** lo construimos. Se escribe DESPUÉS de aprobar `spec.md`. Si algo del
> spec sigue sin definir, volver al spec y cerrar la pregunta antes de planear.

## 1. Arquitectura afectada
- **Solo `@haku/web`**. Componentes, `loading.tsx` por ruta, CSS global y un helper
  de presentación. Cero cambios en `core`, `auth`, `events`, `shared`.
- Frontera respetada: el orden "abierto primero" se computa en `web` combinando
  datos que ya llegan de `@haku/core` (`listVenues`) y del helper local
  `getVenueStatuses` (ya vive en `web/lib/venue-open-now`).
- **Sin dependencias npm de runtime.** View Transitions usa la API nativa del
  navegador (`document.startViewTransition`), sin flag experimental de Next (§7-R1).
  Única dependencia nueva: `vitest` como devDependency de `@haku/web` (hoy `web` no
  tiene runner y esta spec introduce helpers puros que la constitución exige testear;
  misma versión que ya usan core/events, costo cero en runtime).

## 2. Modelo de datos
- **Sin migraciones. Sin RLS nueva.** (Contrato §7 del spec.)
- El mapeo categoría → color/emoji es una constante de presentación en `web`
  (`web/lib/category-visuals.ts`), consolidando el `CATEGORY_EMOJI` que hoy vive
  dentro de `venues-filters.tsx` (se extrae de ahí y se reusa; una sola fuente).

## 3. Diseño de ports y use-cases
No hay ports ni use-cases nuevos. Helpers puros de presentación en `web/lib`:

```ts
// web/lib/category-visuals.ts — única fuente del mapeo visual por categoría
const CATEGORY_VISUALS: Record<string, { emoji: string; bg: string; fg: string }>
// slugs: cafeteria, restaurante, bar, heladeria, panaderia, pizzeria, parrilla,
// cerveceria. Colores tomados de la paleta Tierra (--terra/--moss/--ochre/--rust
// en versión wash para fondo). Fallback: { emoji: "📍", gris de paleta }.
function categoryVisual(slug: string | undefined): CategoryVisual

// web/lib/sort-venues.ts — orden abierto-primero, puro y testeable
function sortVenuesByOpenFirst<T extends { id: string }>(
  venues: T[],
  isOpen: (id: string) => boolean,
  distanceOf?: (id: string) => number | undefined,
): T[]
// Regla: abiertos primero (estable); si distanceOf existe, distancia asc dentro
// de cada grupo; si no, se conserva el orden de llegada dentro de cada grupo.
```

## 4. Diseño de infraestructura
N/A — no hay IO nuevo. Nota: `getVenueStatuses` ya se consulta en `/`, `/lugares`
y `/buscar`; **favoritos** hoy no lo consulta y renderiza filas propias → se agrega
la llamada a `getVenueStatuses` en esa página y se migra su fila custom a
`VenueCard` (unifica O2/O3 sin código duplicado).

## 5. UI / Server Actions / route handlers (`web`)
Sin rutas nuevas ni Server Actions. Cambios por objetivo:

**O1 — Skeletons** (convención `loading.tsx` de App Router, RSC puro):
- `web/components/skeletons.tsx`: `VenueCardSkeleton`, `EventCardSkeleton`,
  `VenueDetailSkeleton`, `ListHeaderSkeleton`. Dimensiones espejo de los
  componentes reales (thumb 64px, líneas 2) para CLS nulo. Pulso con `--card-2` +
  `animate-pulse`; se apaga con `@media (prefers-reduced-motion: reduce)`.
- `loading.tsx` en: `(site)/`, `(site)/lugares/`, `(site)/eventos/`,
  `(site)/buscar/`, `(site)/lugares/[slug]/`, `(site)/eventos/[slug]/`.

**O2 — Placeholder por categoría:**
- `VenueCard`: rama sin `coverImageUrl` pasa de inicial a
  `categoryVisual(category?.slug)` → fondo wash + emoji centrado.
- Héroe del detalle sin foto: mismo visual a tamaño héroe.
- `venues-filters.tsx` importa el emoji desde `category-visuals.ts` (borra su copia).

**O3 — Abierto primero + acento moss:**
- `sortVenuesByOpenFirst` reemplaza el sort actual en `(site)/page.tsx`,
  `(site)/lugares/page.tsx`, `(site)/buscar/page.tsx` y se aplica en
  `perfil/favoritos/page.tsx` (que además pasa a usar `VenueCard` + statuses).
- `VenueCard` con `openNow`: acento `--moss` — borde izquierdo 2px + wash de fondo
  sutil (`rgba` del moss al 6-8 %). Server-rendered: sin salto de hidratación.

**O4 — Héroe en detalle de lugar** (`(site)/lugares/[slug]/page.tsx`):
- Header full-bleed: en mobile ocupa el ancho de viewport (rompe el padding del
  contenedor con margen negativo o layout propio); en ≥ md respeta `max-w` del
  layout 030 con `rounded-[12px]`. Altura `aspect-[4/3]` mobile / `aspect-[16/6]` md.
- Nombre + categoría superpuestos abajo sobre `bg-gradient-to-t from-black/70`.
- `SaveButton` superpuesto arriba-derecha (`bg-black/40 backdrop-blur`, ≥44px).
- Rating + dirección quedan en una fila debajo del héroe. Sin foto → fondo
  `categoryVisual` (O2).

**O5 — View Transitions** (progressive enhancement, sin flag de Next):
- `web/components/transition-link.tsx` (client): un `<Link>` que intercepta el click
  y envuelve `router.push` en `document.startViewTransition()` si existe y si no hay
  `prefers-reduced-motion`; si no, delega al `Link` normal.
- `view-transition-name: venue-image-<id>` inline en el thumb de `VenueCard` y en la
  imagen del héroe del detalle (mismo nombre → morph automático).
- CSS global: duración/easing de `::view-transition-old/new(root)` (cross-fade
  ~200ms) y de los pares con nombre. Todo dentro de
  `@supports (view-transition-name: none)`.

## 6. Estrategia de tests
- **Unit:** `web` hoy NO tiene runner de tests → se agrega vitest dev-dependency a
  `@haku/web` con config mínima (solo `web/lib/**/*.test.ts`, sin jsdom). Alcance:
  `sortVenuesByOpenFirst` — casos: todos abiertos, todos cerrados, mixto estable,
  con y sin distancias, distancia sólo en un grupo. `categoryVisual` — slug conocido,
  desconocido (fallback), undefined.
- **Manual / smoke:** los 7 AC del spec, con dev tools: throttling Slow 3G para AC1,
  device toolbar mobile/desktop para AC4, `prefers-reduced-motion` emulado para AC6,
  Firefox (sin VT API hasta hoy) para AC5-degradación.
- `pnpm -r typecheck` + `pnpm -r test` al final (AC7).

## 7. Riesgos del plan
- **R1 — View Transitions + App Router**: el flag `experimental.viewTransition` de
  Next 15.5 depende de React experimental → NO se usa. Con `startViewTransition`
  manual el riesgo es doble animación o glitch con Suspense; mitigación: envolver
  solo navegaciones card→detalle, cross-fade corto, y si el glitch persiste se
  reduce el alcance a cross-fade sin morph (el spec lo permite como mínimo).
- **R2 — Full-bleed vs layout 030**: margen negativo puede romper en el grid desktop;
  mitigación: full-bleed solo `< md`, contenedor redondeado en `≥ md` (decidido en O4).
- **R3 — Favoritos cambia de renderer** (fila custom → `VenueCard`): riesgo de perder
  el botón "quitar" propio de esa página; mitigación: `VenueCard` ya tiene
  `CardSaveButton` que cumple ese rol (toggle).
- **R4 — Skeletons desincronizados** del contenido real si las cards cambian después;
  mitigación: skeletons viven junto a los componentes reales en un solo archivo con
  comentario cruzado.
- **R5 — Doble fuente de emojis** si queda la copia en `venues-filters`; mitigación:
  la extracción a `category-visuals.ts` es la primera tarea de O2 y borra la copia.

## 8. Orden de implementación
```
1. web/lib/category-visuals.ts (+ tests)          ← base de O2/O4, sin UI
2. web/lib/sort-venues.ts (+ tests)               ← base de O3, sin UI
3. skeletons.tsx + 6 × loading.tsx                ← O1, independiente
4. VenueCard: placeholder categoría (usa 1)       ← O2 cards
5. VenueCard: acento moss + páginas con sort (2)  ← O3 (incluye favoritos→VenueCard)
6. Detalle lugar: héroe (usa 1 para sin-foto)     ← O4 (depende de 4 para visual)
7. transition-link + view-transition-names + CSS  ← O5 (depende de 4 y 6: nombres
                                                     en thumb y héroe)
8. Smoke manual AC1–AC6 + typecheck/test global   ← cierre AC7
```
Dependencias: (1,2,3) paralelizables → 4→5 y 4→6 → 7 → 8.
