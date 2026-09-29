# Tasks — Rediseño visual pulido

> Lista accionable derivada de `plan.md`. Cada tarea: pequeña, testeable, con un
> "hecho" sin ambigüedad. Marcar `[x]` al completar.

## Convenciones
- `T1`, `T2`, ... — orden recomendado.
- `[P]` tarea paralelizable.
- `[B]` bloqueante para otras.

## Tareas

### Base (helpers puros + runner)
- [x] T1 [B] — Agregar `vitest` como devDependency de `@haku/web` con script
  `"test"` y config mínima (`web/lib/**/*.test.ts`, sin jsdom). Hecho: `pnpm
  --filter @haku/web test` corre (0 tests) sin error.
- [x] T2 [P] — Crear `web/lib/category-visuals.ts`: mapa slug→{emoji, bg, fg} con
  las 8 categorías existentes (paleta Tierra en versión wash) + `categoryVisual()`
  con fallback neutro (`📍` + gris). Hecho: exporta tipos y función.
- [x] T3 [P] — Test de `categoryVisual`: slug conocido, desconocido → fallback,
  `undefined` → fallback. Hecho: 3+ casos verdes.
- [x] T4 [P] — Crear `web/lib/sort-venues.ts`: `sortVenuesByOpenFirst(venues,
  isOpen, distanceOf?)` — abiertos primero (estable), distancia asc dentro de cada
  grupo si `distanceOf` está. Hecho: función pura exportada.
- [x] T5 [P] — Tests de `sortVenuesByOpenFirst`: todos abiertos, todos cerrados,
  mixto conserva orden relativo (estabilidad), con distancias en ambos grupos,
  distancia `undefined` va al final de su grupo. Hecho: 5+ casos verdes.
- [x] T6 [P] — Migrar `venues-filters.tsx` a importar el emoji desde
  `category-visuals.ts` y borrar su `CATEGORY_EMOJI` local. Hecho: grep no
  encuentra el mapa duplicado y los chips se ven igual.

### O1 — Skeletons
- [x] T7 [B] — Crear `web/components/skeletons.tsx`: `VenueCardSkeleton`,
  `EventCardSkeleton`, `VenueDetailSkeleton`, `ListHeaderSkeleton` con dimensiones
  espejo de los reales (thumb 64px, 2 líneas) y pulso `--card-2` que se apaga con
  `prefers-reduced-motion`. Hecho: componentes renderizan.
- [x] T8 [P] — `loading.tsx` en `(site)/`, `(site)/lugares/` y `(site)/buscar/`
  (header + N venue skeletons). Hecho: con throttling se ven al navegar.
- [x] T9 [P] — `loading.tsx` en `(site)/eventos/` (event skeletons) y en
  `(site)/lugares/[slug]/` + `(site)/eventos/[slug]/` (detail skeleton).
  Hecho: ídem T8 en las 3 rutas.

### O2 — Placeholder por categoría
- [x] T10 [B] — `VenueCard`: rama sin `coverImageUrl` usa `categoryVisual`
  (fondo wash + emoji centrado) en lugar de la inicial. Hecho: los 3 venues sin
  foto del seed muestran color+emoji de su categoría.

### O3 — Abierto primero + acento moss
- [x] T11 [B] — `VenueCard`: acento moss cuando `openNow` (borde izquierdo 2px
  `--moss` + wash de fondo 6-8 %). Hecho: visible en cards abiertas, cerradas
  intactas.
- [x] T12 — Aplicar `sortVenuesByOpenFirst` en `(site)/page.tsx` reemplazando el
  sort por distancia actual (distancia pasa a criterio secundario). Hecho: AC3 en
  home, con y sin lat/lng.
- [x] T13 [P] — Ídem en `(site)/lugares/page.tsx` y `(site)/buscar/page.tsx`.
  Hecho: abiertos primero en ambas.
- [x] T14 — `perfil/favoritos/page.tsx`: agregar `getVenueStatuses`, migrar la fila
  custom a `VenueCard` (conserva quitar-favorito vía `CardSaveButton`) y aplicar el
  sort. Hecho: favoritos con placeholder, acento y orden consistentes.

### O4 — Héroe en detalle de lugar
- [x] T15 [B] — `(site)/lugares/[slug]/page.tsx`: header héroe — imagen full-bleed
  en mobile (`aspect-[4/3]`), contenida con radios en ≥ md (`aspect-[16/6]`),
  nombre+categoría superpuestos sobre gradiente `from-black/70`. Sin foto → fondo
  `categoryVisual` a tamaño héroe. Hecho: AC4 en mobile y desktop.
- [x] T16 — Reubicar `SaveButton` superpuesto arriba-derecha del héroe
  (`bg-black/40 backdrop-blur`, área ≥44px) y rating+dirección en fila debajo.
  Hecho: tap funciona, contraste legible sobre foto clara y oscura.

### O5 — View Transitions
- [x] T17 [B] — Crear `web/components/transition-link.tsx`: `<Link>` client que
  envuelve la navegación en `document.startViewTransition` si existe y sin
  `prefers-reduced-motion`; si no, `Link` normal. Hecho: navega en Chrome y
  Firefox sin errores de consola.
- [x] T18 — `view-transition-name: venue-image-<id>` en el thumb de `VenueCard` y
  en la imagen del héroe; usar `TransitionLink` en la card. CSS global: cross-fade
  root ~200ms + morph del par nombrado, dentro de `@supports
  (view-transition-name: none)`. Hecho: AC5 (morph en Chrome, degradación limpia).

### Cierre
- [x] T19 — Smoke manual AC1–AC6 (throttling, mobile/desktop, reduced-motion,
  Firefox) + `pnpm -r typecheck` + `pnpm -r test`. Hecho: los 7 AC verificados.

## Verificación final (definition of done)
- [x] `pnpm -r typecheck` pasa.
- [x] `pnpm -r test` pasa.
- [x] Acceptance criteria del spec verificados (AC1-AC4 por HTML SSR + código; AC5/AC6 por código, pendiente check en browser real).
- [x] RLS revisada en la(s) migración(es) nuevas. (N/A: sin migraciones.)
- [x] `BACKLOG.md` actualizado.
