# Plan — Auth Login Logout

## 1. Arquitectura afectada
- `@haku/auth`: implementa `getProfile` (antes stub).
- `@haku/core`: nuevo use-case `createVenue` + port `createVenue` + adapter.
- `@haku/web`: páginas `/login`, `/admin`, `/admin/lugares/nuevo` + middleware +
  helper `lib/auth.ts` (composition root).
- Sin cambios en `@haku/events` ni en la frontera modular.

## 2. Modelo de datos
Ya existía (`profiles` desde 0001). Sin migración nueva.

## 3. Ports y use-cases
```ts
// @haku/auth
getProfile(port, userId): Promise<Result<Profile>>
requireRole(profile, min): Result<void>

// @haku/core
createVenue(repo, input): Promise<Result<Venue>>
interface CoreRepository { ...; createVenue(data: CreateVenueData): Promise<Venue> }
```

## 4. Infraestructura
- `supabase-auth.adapter.getProfile`: `from('profiles').select(...).eq('id', userId).maybeSingle()`.
- `supabase-core.repository.createVenue`: resuelve `categorySlug → id`, inserta,
  mapea `23505` (unique_violation) → `ConflictError`.

## 5. UI / Server Actions / route handlers
- `/login` (RSC + client form + Server Action `loginAction`).
- `/admin/layout` (RSC): `requireProfile('admin')` o renderiza "Acceso denegado".
- `/admin/lugares/nuevo` (RSC) + Server Action `createVenueAction`:
  `requireProfile` → `createVenue` → `revalidatePath('/lugares')` → `redirect`.
- `middleware.ts`: si no hay sesión y path `/admin/*` → redirect a `/login?from=admin`.

## 6. Tests
- Unit: `createVenue` con fake repo (slug inválido, conflict, ok).
- Manual: checklist de aceptación (`checklists/acceptance.md`).

## 7. Riesgos
- Server Action exponiendo `service_role` → NO se usa: el Server Action usa el
  cliente del request (anon + sesión); la mutación pasa por RLS con rol admin.

## 8. Orden
1. `auth.adapter.getProfile`.
2. `core.createVenue`: use-case + port + adapter + test.
3. `web/lib/auth.ts`.
4. `/login` + action + form.
5. middleware: redirect `/admin`.
6. `/admin/layout` + `/admin/page.tsx`.
7. `/admin/lugares/nuevo` (página + action + form).
8. docs/admin-onboarding.md.
