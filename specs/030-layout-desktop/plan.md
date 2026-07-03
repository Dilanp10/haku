# Plan — Layout de escritorio

## 1. Arquitectura afectada
Solo `web/` (presentación responsive). Sin cambios de datos, ports ni Server Actions.
Sin dependencias nuevas.

## 2. Modelo de datos
Sin cambios.

## 3. Diseño de dominio, ports y use-cases
Ninguno.

## 4. Diseño de infraestructura
No aplica.

## 5. UI (`web`) — cambios responsive
Regla general: **no tocar clases base (mobile)**, solo agregar variantes `md:`/`lg:`.

### `site-nav.tsx`
Ampliar `NAV_LINKS` a: Inicio (`/`), Lugares, Eventos, Mapa, Buscar, Más. Render en
`hidden md:flex`. Estado activo por `pathname` (Inicio activo solo en `/`). Mobile sin cambios.

### `site-footer.tsx`
Reemplazar clases shadcn (`bg-muted/30`, `text-muted-foreground`, `bg-primary`) por tokens
Tierra (`var(--line)`, `var(--fg-50)`, `var(--terra)`). Agregar links Buscar/Más.

### Páginas (Home, lugares, eventos, buscar, favoritos)
- Contenedor: `max-w-2xl` → `max-w-2xl md:max-w-5xl` (o `lg:max-w-6xl` en home).
- Envolver la lista de cards en `md:grid md:grid-cols-2 md:gap-x-8`:
  - Home: la sección de lugares y la de eventos, cada una su grilla.
  - `/lugares`, `/eventos`, `/buscar`, favoritos: la lista de resultados.
- Cabeceras/hero/filtros quedan full-width del contenedor (no en grilla).

### Detalle (`/lugares/[slug]`, `/eventos/[slug]`)
Sin cambios (columna angosta para lectura).

## 6. Estrategia de tests
Sin lógica testeable. Gate: `pnpm -r typecheck` + build + verificación visual a ~1400px y
~375px (mobile intacto). Deploy.

## 7. Riesgos del plan
| Riesgo | Mitigación |
|---|---|
| Grilla rompe el look mobile | Solo variantes `md:`; el default (mobile) queda igual |
| `row-sep` desalineado en 2 col | Aceptable; separador por card. Iterar si molesta |
| Nav desktop muy cargada | 6 items máximo, compactos |

## 8. Orden de implementación
```
T1 [B] site-nav.tsx: nav desktop completa
T2 [P] site-footer.tsx: restyle Tierra
T3 [B] home + lugares + eventos + buscar + favoritos: md:max-w-5xl + grilla 2 col
T4 [B] typecheck + build + deploy + verificación
```
