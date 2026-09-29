# SDD — M02: auth

## 1. Identificación
Module: M02
Name: auth (`@haku/auth`)
Status: Approved   <!-- aprobado por el usuario el 2026-09-29 (migración desde spec-kit) -->

## 2. Objetivo
Resolver quién es el usuario actual y qué rol tiene, para que `web` proteja rutas y autorice
mutaciones. La autorización efectiva de datos vive en la RLS de Postgres; este módulo provee
la verificación a nivel aplicación (UX y guardas).

## 3. Alcance
Incluye:
- Sesión sobre Supabase Auth, perfiles (`profiles`) y roles `visitor < editor < admin`.
- Use-cases `getCurrentUser`, `getProfile`, `requireRole`, `hasAtLeast`.
- Login/logout, protección de `/admin` en dos capas y página de perfil (la UI vive en M05).

No incluye:
- UI de login ni de perfil (M05).
- Reglas de negocio de otros dominios.
- Conocimiento de venues o eventos: reciben `userId`/`role` ya resueltos desde `web`.

## 4. Requisitos funcionales
FR-001 — `getCurrentUser(port)` devuelve el usuario autenticado `{ id, email }` o `null`.
FR-002 — `getProfile(port, userId)` devuelve el perfil con rol o `NotFoundError`.
FR-003 — `requireRole(profile, role)` devuelve `ForbiddenError` si el rol es insuficiente; `hasAtLeast` aplica la jerarquía.
FR-004 — Login y logout por Server Action; `/admin` protegido por middleware perimetral y guarda profunda `requireProfile('admin')`.
FR-005 — Al registrarse un usuario se crea su `profiles` con rol `visitor` (trigger).
FR-006 — Existe `/perfil` para el usuario logueado: identidad, antigüedad y accesos rápidos (favoritos, sugerir, admin si corresponde).

## 5. Requisitos no funcionales
NFR-001 — Depende solo de `@haku/shared`; sin imports de `core` ni `events`.
NFR-002 — Dominio y use-cases puros; el IO entra por `AuthPort`.
NFR-003 — Tests de use-cases con fakes, sin red.

## 6. Arquitectura del módulo
Hexagonal-lite: `domain/` (Role, Profile), `application/ports` (`AuthPort`) y
`application/use-cases`, `infrastructure/` (`createSupabaseAuthAdapter`), `index.ts` público.
En `web` el cliente Supabase lleva la sesión por cookies (`@supabase/ssr`).

## 7. Flujo de datos
Usuario → `/login` → Server Action → Supabase Auth → cookie de sesión → middleware `/admin` → `requireProfile('admin')` → Server Action de mutación.

## 8. Modelo de datos
`profiles`: `id (= auth.users.id)`, `displayName`, `role`, `avatarUrl?`, `createdAt`. Relación 1–1 con `auth.users`.

## 9. API
`AuthPort { getCurrentUser(); getProfile(userId) }`. Sin endpoints HTTP propios.

## 10. Seguridad
RLS en `profiles`: SELECT propio, UPDATE solo del propio perfil, cambio de `role` solo `service_role`/admin. `SUPABASE_SERVICE_ROLE_KEY` nunca llega al cliente.

## 11. Dependencias
M01 (shared). Migración `0001_auth_profiles.sql` (M06).

## 12. Criterios de aceptación
- Un visitante anónimo no accede a `/admin`; un admin sí.
- Usuario nuevo queda como `visitor`.
- `pnpm typecheck` y `pnpm test` pasan en `auth/`.
