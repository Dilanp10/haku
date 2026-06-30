# Tasks — PWA Polish + SEO

## Tareas
- [x] T1 — Reusamos `env.appUrl` existente (no hizo falta nueva variable).
- [x] T2 — `web/public/icon.svg` (lettermark "J") + `manifest.webmanifest` enriquecido.
- [x] T3 — `web/app/layout.tsx`: metadata base + viewport multi-theme + skip link + `lang="es-AR"`.
- [x] T4 — `web/app/opengraph-image.tsx` (default sitewide, gradient + lockup).
- [x] T5 — Metadata estática en `/lugares` y `/eventos`.
- [x] T6 — `generateMetadata` dinámica en `/lugares/[slug]` y `/eventos/[slug]`.
- [x] T7 — OG dinámica en `/lugares/[slug]/opengraph-image.tsx` (edge runtime).
- [x] T8 — `web/app/sitemap.ts` (lee venues+events publicados vía RLS pública).
- [x] T9 — `web/app/robots.ts`.
- [x] T10 — `noindex` en `/admin/*` (layout), `/login`, `/lugares/cerca`.
- [x] T11 — `pnpm lint && pnpm -r typecheck && pnpm -r test` verdes a la primera.

## Definition of done
- [x] Typecheck + tests + lint verdes (22 tests, 0 lint issues).
- [x] BACKLOG actualizado.
