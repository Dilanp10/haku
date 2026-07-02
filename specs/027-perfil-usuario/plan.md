# Plan — Página de perfil de usuario

> **Cómo** lo construimos. Se escribe DESPUÉS de aprobar `spec.md`.

## 1. Arquitectura afectada
Solo `web/`. Reusa `getCurrentProfile()` (composition root de auth) y `logoutAction()`.
Sin cambios en `@haku/auth`/`core`/`events`/`shared`. Sin dependencias nuevas.

## 2. Modelo de datos
Sin cambios. Lee `profiles` vía el adapter existente (dentro de `getCurrentProfile`).

## 3. Diseño de dominio, ports y use-cases
Sin ports ni use-cases nuevos. Se consume `getCurrentProfile()` y `logoutAction()`.

## 4. Diseño de infraestructura
Página RSC `force-dynamic` (depende de la sesión). No cachear.

## 5. UI / Server Actions (`web`)
### `web/app/(site)/perfil/page.tsx` (RSC)
```ts
export const dynamic = "force-dynamic";
export default async function PerfilPage() {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login?from=/perfil");
  // header con avatar/inicial + displayName + rol + "miembro desde" (Intl.DateTimeFormat)
  // lista de accesos (favoritos, sugerir, admin si role==="admin")
  // <LogoutButton /> o <form action={logoutAction}>
}
```
- Rol mostrado en español: visitor→"Visitante", editor→"Editor", admin→"Administrador".
- "Miembro desde": `Intl.DateTimeFormat("es-AR", { month: "long", year: "numeric" })`.
- Reusa el patrón visual de `/mas` (lista `divide-y`, iconos terra, `text-brand`).

### Botón cerrar sesión
Opción A (preferida): `<form action={logoutAction}>` con un `<button>` — no requiere client
component (Server Action directa). `logoutAction` ya hace `signOut()` + `redirect("/")`.

### Autorización
La propia página redirige si no hay perfil. No expone datos de otros usuarios.

## 6. Estrategia de tests
Sin lógica testeable nueva. Gate: `pnpm -r typecheck` + verificación manual
(logueado ve el perfil; deslogueado redirige a login; logout funciona).

## 7. Riesgos del plan
| Riesgo | Mitigación |
|---|---|
| `logoutAction` importada en RSC | Es Server Action (`"use server"`); se puede pasar como `action` de un `<form>` |
| Usuario sin fila en `profiles` | `getCurrentProfile` devuelve null → redirect a login (aceptable) |

## 8. Orden de implementación
```
T1 [B] web/app/(site)/perfil/page.tsx: RSC con perfil + accesos + form logout
T2 [B] typecheck + build + deploy + verificación manual
```
