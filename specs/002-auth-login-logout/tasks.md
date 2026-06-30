# Tasks — Auth Login Logout

## Tareas
- [x] T1 — Implementar `@haku/auth.adapter.getProfile` real.
- [x] T2 — `@haku/core.createVenue` use-case + Zod + `Result`.
- [x] T3 — Agregar `createVenue` al `CoreRepository` port.
- [x] T4 — Adapter Supabase de `createVenue` (resuelve categoría, mapea 23505).
- [x] T5 — Exportar `createVenue` + `CreateVenueData` desde `@haku/core`.
- [x] T6 — Test `create-venue.use-case.test.ts` (3 casos).
- [x] T7 — `web/lib/auth.ts`: `getCurrentProfile`, `requireProfile`.
- [x] T8 — `/login` page + `login-form.tsx` + `actions.ts` (`loginAction`, `logoutAction`).
- [x] T9 — Middleware: redirect a `/login` para `/admin/*` sin sesión.
- [x] T10 — `/admin/layout.tsx` con guarda profunda + topbar + logout.
- [x] T11 — `/admin/page.tsx` (dashboard).
- [x] T12 — `/admin/lugares/nuevo` (page + action + form).
- [x] T13 — `docs/admin-onboarding.md`.

## Definition of done
- [x] Typecheck + tests verdes.
- [x] Acceptance checklist verificable manualmente con Supabase local.
