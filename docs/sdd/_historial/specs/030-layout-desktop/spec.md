# Feature Spec — Layout de escritorio (desktop)

> Documento de **qué** se construye y **por qué**. Feature nueva.

## 1. Resumen
La app es mobile-first y se ve bien en el celular, pero en escritorio queda desordenada:
todo es una columna angosta (`max-w-2xl`) centrada con mucho espacio vacío a los lados, y
—crítico— en desktop el `BottomNav` está oculto y el header solo tiene 2 links, dejando
**Mapa, Buscar, Más y perfil inaccesibles**. Esta feature agrega un layout propio para
escritorio (nav completa + uso del ancho con grillas), **sin tocar la vista mobile**.

## 2. Motivación
En pantallas anchas el contenido se ve perdido y falta navegación. Un layout de escritorio
adecuado mejora la usabilidad y la sensación de producto terminado en la compu.

## 3. Objetivos (en alcance)
- O1 — **Nav de escritorio completa** en el header (`md:flex`): Inicio, Lugares, Eventos,
  Mapa, Buscar y Más. En mobile no cambia nada (sigue el `BottomNav`).
- O2 — **Uso del ancho**: en `md+` los contenedores principales se ensanchan
  (`max-w-2xl` → `md:max-w-5xl`) y las listas de cards pasan a **grilla de 2 columnas**
  (`md:grid md:grid-cols-2`). En mobile siguen siendo lista de 1 columna.
- O3 — Aplica a: Home, `/lugares`, `/eventos`, `/buscar`, `/perfil/favoritos`.
- O4 — Footer de escritorio restyleado con paleta Tierra (hoy usa clases shadcn viejas).
- O5 — Las páginas de detalle (`/lugares/[slug]`, `/eventos/[slug]`) se mantienen en columna
  angosta (lectura), sin grilla.

## 4. No-objetivos (fuera de alcance, declarados)
- N1 — Cambiar la vista mobile (queda idéntica).
- N2 — Rediseñar las cards en versión "vertical" de escritorio (se reusan las row-cards en grilla).
- N3 — Sidebar de filtros en desktop (los filtros siguen arriba; se puede evaluar aparte).
- N4 — Panel `/admin` (ya tiene su propio layout, spec 028).

## 5. Usuarios y permisos
Sin cambios de permisos. Es responsive/presentación.

## 6. Comportamiento esperado
### Caso feliz (desktop ≥ 768px)
1. El usuario entra desde la compu.
2. Ve una barra superior con todas las secciones y puede navegar a cualquiera.
3. El contenido usa el ancho: los lugares/eventos se muestran en 2 columnas.

### Caso feliz (mobile < 768px)
1. Igual que hoy: columna única, `BottomNav`, sin cambios visuales.

### Edge cases
- Breakpoint intermedio (~768px): la grilla pasa de 1 a 2 columnas de forma limpia.
- Listas con 1 solo resultado: ocupa una celda de la grilla (no se estira raro).

## 7. Contratos de módulo afectados
Ninguno en `core`/`auth`/`events`/`shared`. Solo `web/`:
- `web/components/site-nav.tsx` — nav de escritorio completa.
- `web/components/site-footer.tsx` — restyle Tierra.
- `web/app/(site)/page.tsx`, `/lugares/page.tsx`, `/eventos/page.tsx`, `/buscar/page.tsx`,
  `/perfil/favoritos/page.tsx` — ancho `md:max-w-5xl` + grilla `md:grid-cols-2`.

## 8. Criterios de aceptación
- AC1 — En desktop el header ofrece Inicio, Lugares, Eventos, Mapa, Buscar y Más.
- AC2 — En desktop, Home y las listas muestran cards en 2 columnas usando el ancho.
- AC3 — En mobile no cambia nada respecto de la versión actual.
- AC4 — Las páginas de detalle siguen en columna angosta.
- AC5 — `pnpm -r typecheck` pasa.

## 9. Riesgos y supuestos
- **Row-cards en grilla:** las cards son filas (thumb + texto + `row-sep`); en 2 columnas
  cada una ocupa media grilla con su separador inferior. Aceptable visualmente (directorio
  a dos columnas). Si no convence, se evalúa una card vertical aparte (N2).
- Breakpoint `md` (768px) como umbral mobile/desktop, consistente con `BottomNav md:hidden`.

## 10. Preguntas abiertas
_(ninguna — se puede iterar el detalle visual tras verlo en producción.)_

## 11. Specs que esta feature evoluciona
- Extiende el sistema visual de **022** con un layout responsive de escritorio; completa la
  navegación de **027** (acceso a Más/perfil también desde el header en desktop).
