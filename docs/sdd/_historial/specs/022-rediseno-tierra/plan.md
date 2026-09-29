# Plan — Rediseño Tierra

> **Cómo** lo construimos. Backfill: documenta la arquitectura tal como se implementó.

## 1. Arquitectura afectada
Solo `web/` (capa de presentación). Sin cambios en `core`/`auth`/`events`/`shared`.
Sin dependencias npm nuevas más allá de `next-themes` (ya presente).

## 2. Modelo de datos
Sin cambios de datos.

## 3. Diseño de dominio, ports y use-cases
No aplica — no hay lógica de negocio nueva.

## 4. Diseño de infraestructura
No aplica.

## 5. UI / Server Actions (`web`)

### Sistema de tokens (`globals.css`)
- `:root` con paleta Tierra light; `.dark` (o `[data-theme=dark]`) con la variante oscura.
- Variables: `--bg`, `--bg-deep`, `--card-bg`, `--card-2`, `--line`, `--line-2`,
  `--fg`, `--fg-70/50/30`, `--terra`, `--terra-deep/soft/wash`, `--ochre`, `--moss`, `--rust`.
- Utilidades `@layer`: `.text-brand`, `.text-data`, `.text-section`, `.row-sep`,
  `.scrollbar-none`, `.pb-bottom`.

### Componentes
| Archivo | Rol |
|---|---|
| `web/components/venue-card.tsx` | List-card lugar (thumb 64px, meta, `row-sep`) |
| `web/components/event-card.tsx` | List-card evento (date-block o thumb) |
| `web/components/site-nav.tsx` | Header minimal (logo terracota) |
| `web/components/bottom-nav.tsx` | 4 tabs mobile con estado activo |
| `web/components/site-footer.tsx` | Footer desktop |
| `web/components/theme-provider.tsx` / `theme-toggle.tsx` | next-themes |
| `web/components/{category,price,food-type}-pills.tsx` | Pills con paleta |

### Páginas
`web/app/(site)/page.tsx` (hero + secciones), `/lugares/[slug]`, `/eventos/[slug]`,
`/perfil/favoritos`, `/mas`, `/mapa`, más los sub-componentes de detalle
(`rating-display`, `rating-picker`, `save-button`, `opening-hours`).

### Autorización
Sin cambios (capa visual).

## 6. Estrategia de tests
No hay lógica testeable nueva. Gate: `pnpm -r typecheck`. Verificación visual manual +
deploy de preview.

## 7. Riesgos del plan
| Riesgo | Mitigación |
|---|---|
| Hydration mismatch de tema | `suppressHydrationWarning` + montar toggle tras `mounted` |
| Inconsistencias entre light/dark | Definir todos los tokens en ambos temas; usar solo variables |
| Contraste insuficiente en dark | Ajustar `--fg-*` con opacidades sobre `--bg` oscuro |

## 8. Orden de implementación
```
T1 [B] globals.css: tokens Tierra light/dark + utilidades
T2 [B] tailwind.config.ts: mapear tokens
   ↓
T3 [P] theme-provider + theme-toggle (next-themes)
T4 [P] venue-card + event-card (list-card)
T5 [P] site-nav + bottom-nav + site-footer
   ↓
T6 [B] home + páginas de detalle + favoritos + /mas + /mapa
```
