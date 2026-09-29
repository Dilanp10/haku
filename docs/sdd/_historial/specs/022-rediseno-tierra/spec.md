# Feature Spec — Rediseño Tierra (sistema visual y navegación)

> Documento de **qué** se construye y **por qué**. No describe cómo (eso va en `plan.md`).
>
> **Nota de backfill:** implementado y deployado antes de escribir la spec (deuda de SDD
> reconocida). Este documento lo formaliza retroactivamente.

## 1. Resumen
Rediseño integral de la UI pública de Haku con la paleta **"Tierra"** (crema/terracota/ocre/
musgo), tipografía serif para títulos + mono para datos, y un patrón mobile-first de
**list-cards** (thumbnail 64px + separadores). Se rehace la navegación (bottom-nav de 4 tabs,
header minimal), se agrega **dark mode** y se unifica el lenguaje visual en todas las páginas.

## 2. Motivación
La UI previa usaba los defaults de shadcn (grises neutros, cards con sombra) que no
transmitían identidad ni el carácter local/cálido de Catamarca. Un sistema visual propio
y consistente mejora la percepción de marca y la usabilidad mobile.

## 3. Objetivos (en alcance)
- O1 — **Tokens de color Tierra** en CSS variables, con variantes light y dark
  (`--bg`, `--terra`, `--ochre`, `--moss`, `--rust`, `--fg`, `--line`, etc.).
- O2 — **Utilidades tipográficas**: `.text-brand` (serif), `.text-data` (mono), `.text-section`
  (mono uppercase ocre), `.row-sep`, `.scrollbar-none`.
- O3 — **Patrón list-card** en `VenueCard` / `EventCard`: fila con thumb 64px + separador.
- O4 — **Home** estilo editorial: hero serif ("Haku."), secciones de lugares y eventos.
- O5 — **Navegación**: `BottomNav` (Inicio, Eventos, Mapa, Más) en mobile; header minimal
  (logo + acciones) en desktop.
- O6 — **Página `/mas`**: hub de opciones (perfil, sugerir, about) + ajustes.
- O7 — **Dark mode** con `next-themes` y selector Claro/Oscuro/Sistema.
- O8 — Rediseño de las páginas internas de detalle (`/lugares/[slug]`, `/eventos/[slug]`),
  favoritos y componentes asociados (rating, save, opening-hours) con la paleta.
- O9 — **Mapa full-screen** (`/mapa`) con pines SVG temáticos.

## 4. No-objetivos (fuera de alcance, declarados)
- N1 — Filtros avanzados y "abierto ahora" (spec 023).
- N2 — Rediseño de `/buscar` (spec 026).
- N3 — Cambios en la lógica de negocio o contratos de `core`/`events`.
- N4 — Nuevas features funcionales (solo re-skin + reorganización de navegación).
- N5 — Rediseño del panel `/admin` (mantiene el estilo shadcn utilitario).

## 5. Usuarios y permisos
Sin cambios de permisos: es una capa de presentación. Todos los roles ven la nueva UI
pública; el admin mantiene su panel utilitario.

## 6. Comportamiento esperado
### Caso feliz — navegación mobile
1. El usuario abre la app en el celular.
2. Ve el hero "Haku." y las secciones en list-cards.
3. Navega con el bottom-nav de 4 tabs; la tab activa se resalta en terracota.
4. En "Más" accede a perfil, sugerir un lugar, about y ajustes (tema).

### Caso feliz — dark mode
1. El usuario entra a `/mas` → Ajustes → Tema.
2. Elige Claro / Oscuro / Sistema; el cambio es inmediato y persiste (localStorage vía next-themes).

### Edge cases
- Venue/evento sin imagen → placeholder con la inicial del nombre sobre `--card-2`.
- Preferencia de sistema en oscuro → "Sistema" respeta `prefers-color-scheme`.

## 7. Contratos de módulo afectados
Ninguno en `core`/`auth`/`events` (Principio III intacto). Todo el cambio vive en `web/`:
- `web/app/globals.css` — tokens Tierra (light/dark) + utilidades.
- `web/tailwind.config.ts` — mapeo de tokens.
- `web/components/*` — `venue-card`, `event-card`, `site-nav`, `bottom-nav`, `site-footer`,
  `theme-provider`, `theme-toggle`, pills.
- `web/app/(site)/*` — home, detalle lugar/evento, favoritos, /mas, mapa.

## 8. Criterios de aceptación
- AC1 — La paleta Tierra se aplica de forma consistente en toda la UI pública.
- AC2 — Light y dark mode funcionan y el selector persiste la preferencia.
- AC3 — `VenueCard`/`EventCard` usan el patrón list-card (thumb 64px + `row-sep`).
- AC4 — Bottom-nav de 4 tabs con estado activo; header minimal en desktop.
- AC5 — Mobile-first: layouts legibles y usables en viewport ~380px.
- AC6 — `pnpm -r typecheck` pasa (sin cambios de contrato).

## 9. Riesgos y supuestos
- **Hydration de tema:** `next-themes` requiere `suppressHydrationWarning` y montar el toggle
  tras `mounted` para evitar mismatch.
- **Supuesto:** el panel admin queda fuera del rediseño (decisión N5) — coherencia diferida.

## 10. Preguntas abiertas
_(ninguna — feature en producción, spec formaliza el estado.)_

## 11. Specs que esta feature evoluciona
- Ajusta la presentación de features previas (003 discovery, 014 favoritos, 015 ratings,
  016 horarios) sin tocar su comportamiento ni contratos.
