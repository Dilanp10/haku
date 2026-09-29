# Feature Spec — PWA Polish + SEO

> Estado: **en implementación** (Fase 6).

## 1. Resumen
Hacer Haku presentable cuando se comparte y descubrible cuando se busca:
metadata sitewide, Open Graph dinámico por venue/evento, sitemap, robots,
manifest fino, icono SVG y mejoras básicas de accesibilidad.

## 2. Motivación
La app funciona pero es invisible afuera. Un link a `/lugares/cafe-del-valle`
pegado en WhatsApp no muestra preview; Google no sabe que existe; `/admin` se
podría indexar si alguien filtra el link. Esta feature cierra esa brecha sin
introducir nuevos módulos ni features.

## 3. Objetivos
- O1 — Metadata base (title template, description, locale, theme color, manifest).
- O2 — `generateMetadata` por página clave: listados (estática) y detalles (dinámica).
- O3 — Open Graph **dinámico** en `/lugares/[slug]` (next/og ImageResponse) +
  default sitewide.
- O4 — `sitemap.ts` dinámico desde venues+events `published`; `robots.ts` con
  disallow para `/admin`, `/api`, `/login`, `/lugares/cerca` (depende de coords).
- O5 — Manifest enriquecido + icono SVG simple.
- O6 — Skip link y `lang="es-AR"` para accesibilidad básica.

## 4. No-objetivos
- N1 — Service worker / offline real (queda en backlog).
- N2 — Iconos PNG en todos los tamaños (con SVG alcanza para modernos).
- N3 — OG dinámico en eventos (mismo patrón, no agrega valor demostrativo extra).
- N4 — Analytics / pixels.

## 5. Usuarios y permisos
N/A — la metadata es pública y se aplica a páginas públicas. `/admin` y `/login`
deben quedar **noindex** explícito.

## 6. Comportamiento esperado
- Compartir `https://.../lugares/<slug>` en redes muestra un card con nombre del
  venue, descripción y una OG image generada con su nombre.
- `https://.../sitemap.xml` lista la home, `/lugares`, `/eventos`, todos los
  venues publicados y todos los eventos publicados con fecha futura.
- `https://.../robots.txt` permite `/`, `/lugares`, `/lugares/*`, `/eventos`,
  `/eventos/*` y bloquea `/admin*`, `/login*`, `/api*`, `/lugares/cerca*`.
- HTML raíz declara `lang="es-AR"`; el primer foco táctil/tab cae en un
  "Saltar al contenido".

## 7. Contratos de módulo
- Solo `web/` cambia. Lee de `@haku/core` (`listVenues`, `getVenueBySlug`) y
  `@haku/events` (`listUpcomingEvents`, `getEventBySlug`) — todo ya existe.
- Sin cambios de schema, ports ni adapters.

## 8. Criterios de aceptación
- AC1 — `pnpm lint && pnpm -r typecheck && pnpm -r test` ✅.
- AC2 — `view-source:` de `/` muestra `<title>`, `<meta name=description>` y
  `og:*` poblados.
- AC3 — `view-source:` de `/lugares/<slug>` muestra og:image apuntando a la ruta
  generada (`/lugares/<slug>/opengraph-image`).
- AC4 — `/sitemap.xml` y `/robots.txt` responden con contenido correcto.
- AC5 — `/admin` y `/login` traen `<meta name=robots content="noindex">`.
- AC6 — Frontera modular respetada (lint no detecta deep imports).

## 9. Riesgos
- `next/og` usa Edge runtime por default; las páginas pueden necesitar declarar
  `runtime`. Documentar.
- Sitemap dinámico requiere consultar la BD en build/request → marca esa ruta
  como dinámica para no requerir migraciones del proceso de build.

## 10. Decisiones (resueltas)
- OG dinámico SOLO en `/lugares/[slug]` (demo del patrón). Eventos lo heredan en
  el futuro si se necesita.
- Iconos: un único SVG (`/public/icon.svg`); navegadores modernos lo aceptan en
  manifest. PNG queda para una feature posterior si hace falta soporte legacy.
- Sitemap y robots como Route Handlers de Next (`sitemap.ts` / `robots.ts`).
