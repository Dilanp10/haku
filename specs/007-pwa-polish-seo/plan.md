# Plan — PWA Polish + SEO

## 1. Arquitectura afectada
Solo `web/`. Sin cambios en dominios ni en `shared`.

## 2. Modelo de datos
Sin cambios.

## 3. Ports y use-cases
Consume los existentes: `listVenues`, `getVenueBySlug`, `listUpcomingEvents`,
`getEventBySlug`. Composition root: cada handler arma su Supabase server-client
y su repo, como hacen `/lugares` y `/eventos`.

## 4. Infraestructura
- Base URL para OG/sitemap: `process.env.NEXT_PUBLIC_SITE_URL`, fallback a
  `http://localhost:3000` para dev. Agregar a `.env.example` y a `lib/env`.

## 5. UI / Server Actions / route handlers
- `web/app/layout.tsx`:
  - `metadata` con title template `%s · Haku`, description, keywords, OG defaults.
  - `viewport` con theme-color (light/dark).
  - `<html lang="es-AR">`.
  - Skip link al inicio del `<body>` → `#main`.
  - Cada `<main>` recibe `id="main"`.
- `web/app/opengraph-image.tsx` — default sitewide (1200x630, gradient + título).
- `web/app/lugares/page.tsx` — `metadata` estática (lista de lugares).
- `web/app/lugares/[slug]/page.tsx` — `generateMetadata(params)` dinámica.
- `web/app/lugares/[slug]/opengraph-image.tsx` — `ImageResponse` con `venue.name`.
- `web/app/eventos/page.tsx` — `metadata` estática.
- `web/app/eventos/[slug]/page.tsx` — `generateMetadata(params)` dinámica.
- `web/app/admin/layout.tsx` y `web/app/login/page.tsx` — `metadata.robots = noindex,nofollow`.
- `web/app/lugares/cerca/page.tsx` — `metadata.robots = noindex`.
- `web/app/sitemap.ts` — async, consulta venues+events publicados, devuelve URLs.
- `web/app/robots.ts` — declara allow/disallow.
- `web/public/manifest.webmanifest` — enriquecer (scope, start_url, theme_color,
  background_color, icons[], categories, lang).
- `web/public/icon.svg` — lettermark "J" sobre azul (primary del theme).

## 6. Tests
Esta feature es casi 100% configuración + render. No hay use-cases nuevos.
Cobertura por `lint + typecheck` (Next valida la forma de `metadata`/`Sitemap`/`Robots`).

## 7. Riesgos
- `opengraph-image.tsx` requiere `runtime = 'edge'` por convención (next/og
  funciona también en node pero edge es lo recomendado). Declararlo explícito.
- `getServerSupabase()` en `sitemap.ts` debe usar el cliente del request — pero
  un sitemap no tiene request user; usar `createAdminSupabase()` con
  `service_role` o, mejor, levantar un cliente público (anon) sin sesión.
  Decisión: cliente público anon — RLS ya filtra `published`.

## 8. Orden
1. `.env.example` + `lib/env`: añadir `NEXT_PUBLIC_SITE_URL`.
2. `manifest.webmanifest` + `icon.svg`.
3. `layout.tsx`: metadata sitewide + skip link + `lang`.
4. `opengraph-image.tsx` default.
5. `metadata` estática en listados + dinámica en detalles.
6. OG dinámica en `/lugares/[slug]`.
7. `sitemap.ts` + `robots.ts`.
8. `noindex` en admin/login/cerca.
9. Lint + typecheck + test.
