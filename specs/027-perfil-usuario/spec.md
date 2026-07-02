# Feature Spec — Página de perfil de usuario

> Documento de **qué** se construye y **por qué**. Feature nueva (flujo SDD completo).

## 1. Resumen
La ruta `/perfil` está linkeada desde `/mas` ("Mi perfil") pero **nunca se implementó** →
devuelve 404. Esta feature crea la página de perfil: un hub del usuario logueado con su
identidad (nombre, rol, antigüedad), accesos rápidos (favoritos, sugerir, panel admin si
corresponde) y **cerrar sesión**. Si no hay sesión, redirige a login.

## 2. Motivación
Un link roto a 404 desde la navegación principal es un bug visible. Además, el usuario no
tiene hoy ningún lugar para ver su sesión ni cerrarla desde la UI pública.

## 3. Objetivos (en alcance)
- O1 — Página `/perfil` (RSC) que resuelve el perfil con `getCurrentProfile()`.
- O2 — Sin sesión → `redirect("/login?from=/perfil")`.
- O3 — Muestra: avatar (o inicial), `displayName` (o "Usuario"), rol, y "miembro desde"
  (`createdAt`).
- O4 — Accesos: **Mis favoritos** (`/perfil/favoritos`), **Sugerir un lugar**
  (`/lugares/sugerir`), y **Panel de administración** (`/admin`) solo si `role === "admin"`.
- O5 — Botón **Cerrar sesión** (reusa `logoutAction` existente).
- O6 — Estilo Tierra, consistente con `/mas`.

## 4. No-objetivos (fuera de alcance, declarados)
- N1 — Edición del perfil (cambiar nombre/avatar/contraseña).
- N2 — Registro de usuarios nuevos (no hay signup público hoy).
- N3 — Historial de actividad / lugares sugeridos por el usuario.
- N4 — Mostrar el email (el `Profile` de dominio no lo expone; se evita otra query).

## 5. Usuarios y permisos
| Rol      | Lo que puede hacer                                                    |
|----------|-----------------------------------------------------------------------|
| anónimo  | Redirigido a `/login?from=/perfil`.                                    |
| visitor/editor | Ve su perfil, favoritos, sugerir y cerrar sesión.               |
| admin    | Además ve el acceso al panel `/admin`.                                 |

## 6. Comportamiento esperado
### Caso feliz
1. Usuario logueado toca "Mi perfil" en `/mas`.
2. `/perfil` muestra su nombre/rol/antigüedad y los accesos.
3. Puede ir a favoritos/sugerir/admin o cerrar sesión (→ vuelve a `/`).

### Edge cases
- Sin sesión → redirect a login con `from=/perfil` (vuelve al perfil tras loguearse).
- `displayName` null → se muestra "Usuario" y la inicial "U" en el avatar.
- `avatarUrl` ausente → avatar con inicial sobre `--card-2`.

## 7. Contratos de módulo afectados
Ninguno nuevo. Reusa:
- `getCurrentProfile()` (`web/lib/auth.ts`) → `Profile { id, displayName, role, avatarUrl?, createdAt }`.
- `logoutAction()` (`web/app/(site)/login/actions.ts`).
- El `from` de `loginAction` ya soporta redirect de vuelta (se pasa `/perfil`).

Nuevo archivo: `web/app/(site)/perfil/page.tsx`. Posible componente client mínimo para el
botón de logout (`logout-button.tsx`) o un `<form action={logoutAction}>`.

## 8. Criterios de aceptación
- AC1 — `/perfil` ya no da 404; renderiza el perfil del usuario logueado.
- AC2 — Sin sesión → redirige a `/login?from=/perfil`.
- AC3 — Muestra nombre, rol y "miembro desde".
- AC4 — Accesos a favoritos y sugerir; el de admin solo si `role==="admin"`.
- AC5 — "Cerrar sesión" cierra la sesión y redirige a `/`.
- AC6 — `pnpm -r typecheck` pasa.

## 9. Riesgos y supuestos
- **Supuesto:** `getProfile` requiere una fila en `profiles` para el usuario. Si un usuario
  autenticado no tuviera perfil, `getCurrentProfile()` devuelve null → se trataría como sin
  sesión (redirect a login). Aceptable para el MVP.
- Sin dependencias nuevas.

## 10. Preguntas abiertas
_(ninguna.)_

## 11. Specs que esta feature evoluciona
- Completa la navegación introducida en **022** (el link "Mi perfil" de `/mas`).
- Complementa **002 (auth login/logout)**: expone el logout en la UI pública.
