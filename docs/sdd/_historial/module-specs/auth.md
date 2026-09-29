# SPEC — `@haku/auth` (Identidad)

> Sesión, perfiles y roles sobre Supabase Auth. Depende solo de `@haku/shared`.
> No conoce venues ni eventos.

## 1. Responsabilidad
Resolver **quién** es el usuario actual y **qué rol** tiene, para que `web` proteja
rutas y autorice mutaciones. La autorización efectiva de datos vive en la **RLS** de
Postgres; este módulo provee la verificación a nivel aplicación (UX y guardas).

## 2. Modelo
- **Role**: `'visitor' | 'editor' | 'admin'`.
- **Profile**: `id (= auth.users.id), displayName, role, avatarUrl?, createdAt`.
- Tabla `profiles` 1–1 con `auth.users`; se crea por trigger al registrarse (rol
  inicial `visitor`).

## 3. Port
```ts
interface AuthPort {
  getCurrentUser(): Promise<AuthUser | null>;   // { id, email }
  getProfile(userId: string): Promise<Profile | null>;
}
```

## 4. API pública (use-cases)
| Función | Descripción |
|---|---|
| `getCurrentUser(port)` | Usuario autenticado o `null`. |
| `getProfile(port, userId)` | Perfil (rol incluido) o `Result<NotFound>`. |
| `requireRole(profile, role)` | `Result<void>`; `ForbiddenError` si el rol es insuficiente. |
| `hasAtLeast(role, min)` | Helper puro de jerarquía de roles. |

Jerarquía: `visitor < editor < admin`.

## 5. Infraestructura
`createSupabaseAuthAdapter(client): AuthPort` usando `supabase.auth.getUser()` y la tabla
`profiles`. En `web` el cliente lleva la sesión (cookies) vía `@supabase/ssr`.

## 6. Datos / RLS
- `profiles`: `SELECT` propio del usuario (y público de campos no sensibles si se decide);
  `UPDATE` solo del propio perfil; cambio de `role` solo `service_role`/`admin`.
- Trigger `on auth.users insert` → crea `profiles` con `role='visitor'`.

## 7. Contrato hacia `web`
`web` llama `requireRole` antes de ejecutar Server Actions de mutación de `core`/`events`.
Los otros dominios **no** importan `auth`: reciben `userId`/`role` ya resueltos desde `web`.

## 8. No-objetivos
- No implementa login UI (eso es `web`).
- No decide reglas de negocio de otros dominios.
