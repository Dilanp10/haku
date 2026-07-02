# Tasks — Rediseño Tierra

> Derivado de `plan.md`. `[x]` = shipeado (backfill).

## Tareas

### Bloque 1 — Tokens
- [x] T1 [B] — `globals.css`: paleta Tierra en `:root` (light) y `.dark` (oscuro) + utilidades
  `.text-brand`, `.text-data`, `.text-section`, `.row-sep`, `.scrollbar-none`, `.pb-bottom`.
- [x] T2 [B] — `tailwind.config.ts`: mapear tokens a colores/fuentes de Tailwind.

### Bloque 2 — Tema y componentes base
- [x] T3 [P] — `theme-provider.tsx` + `theme-toggle.tsx` con `next-themes` (Claro/Oscuro/Sistema).
- [x] T4 [P] — `venue-card.tsx` + `event-card.tsx`: patrón list-card (thumb 64px + `row-sep`).
- [x] T5 [P] — `site-nav.tsx` (header minimal) + `bottom-nav.tsx` (4 tabs) + `site-footer.tsx`.
- [x] T6 [P] — Pills (`category`, `price`, `food-type`) con la paleta.

### Bloque 3 — Páginas
- [x] T7 [B] — Home (`page.tsx`): hero serif + secciones list-card.
- [x] T8 [B] — Detalle `/lugares/[slug]` + sub-componentes (rating-display, rating-picker,
  save-button, opening-hours) con paleta Tierra.
- [x] T9 [B] — Detalle `/eventos/[slug]`.
- [x] T10 [B] — `/perfil/favoritos` (list-card + empty state).
- [x] T11 [B] — `/mas` (hub + ajustes de tema).
- [x] T12 [B] — `/mapa` full-screen con pines SVG.

## Verificación final
- [x] AC1 — Paleta consistente en toda la UI pública.
- [x] AC2 — Light/dark funcionan y persisten.
- [x] AC3 — Cards en patrón list-card.
- [x] AC4 — Bottom-nav 4 tabs + header minimal.
- [x] AC5 — Mobile-first legible en ~380px.
- [ ] `pnpm -r typecheck` (gate de cierre; sin cambios de contrato).
