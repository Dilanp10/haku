# Feature Spec — Auth Login Logout

> Estado: **completado** (Fase 2).

## 1. Resumen
Login y logout con Supabase Auth, rutas `/admin` protegidas en dos capas (middleware
perimetral + guarda profunda con `requireProfile('admin')`), composition root real
entre `@haku/auth` y `@haku/core` (crear venue).

## 2. Motivación
Sin identidad y autorización no se pueden moderar contenidos ni mutar el catálogo.
Es el habilitador de toda la administración (venues, eventos en Fase 3).

## 3. Objetivos
- O1 — `/login` con email/password (Supabase) y `/logout`.
- O2 — Middleware redirige a `/login?from=admin` si no hay sesión.
- O3 — `/admin/*` solo accesible con rol `admin`.
- O4 — Server Action `createVenue` compone `requireProfile + @haku/core.createVenue`
  + `revalidatePath('/lugares')`.
- O5 — `auth.adapter.getProfile` con consulta real a `profiles`.

## 4. No-objetivos
- N1 — Recuperación de contraseña / magic link.
- N2 — Edición/archivado de venues (queda en backlog).
- N3 — UI de gestión de usuarios.

## 5. Usuarios y permisos
| Rol     | Puede |
|---------|-------|
| visitor | navegar `/`, `/lugares`, `/lugares/[slug]` |
| editor  | (reservado para futuro; jerarquía existe) |
| admin   | acceder a `/admin/*`, crear venues |

Trigger `handle_new_user` crea un `profile` con rol `visitor` al registrarse.

## 6. Comportamiento esperado
- Login con credenciales válidas redirige a `/` o a `/admin` si vino con `from=admin`.
- Login fallido muestra error inline; sin redirect.
- Visitar `/admin` sin sesión → `/login?from=admin`.
- Visitar `/admin` con sesión pero rol < admin → página "Acceso denegado".
- Crear un venue desde `/admin/lugares/nuevo` con datos válidos publica/borra-borrador
  el venue y redirige a su detalle.
- Crear un venue con slug duplicado → `ConflictError` visible en el formulario.

## 7. Contratos de módulo
- `@haku/auth`: `getProfile` real (Supabase), `requireRole` puro (ya existía).
- `@haku/core`: `createVenue` (use-case + port + adapter); manejo de `23505` →
  `ConflictError`.
- `web/lib/auth.ts`: `getCurrentProfile`, `requireProfile(role)`.
- Server Action `createVenueAction` (validación de FormData + composición).

## 8. Criterios de aceptación
- AC1 — `pnpm -r typecheck` y `pnpm -r test` ✅.
- AC2 — Visitor sin sesión NO ve `/admin` (redirect).
- AC3 — Visitor con sesión NO crea venues (RLS + guarda app).
- AC4 — Admin crea un venue y aparece en `/lugares` tras revalidar.
- AC5 — `service_role` NO se importa desde código que llegue al cliente.

## 9. Riesgos
- Drift entre la guarda de aplicación y RLS → mitigado por RLS estricta como barrera
  real; la guarda app es UX.
- Cookies de Supabase + middleware en monorepo → cubierto por `@supabase/ssr`.

## 10. Preguntas abiertas
Ninguna pendiente.
