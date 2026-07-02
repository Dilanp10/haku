# Tasks — Página de perfil de usuario

> Derivado de `plan.md`. Feature nueva.

## Tareas
- [x] T1 [B] — Crear `web/app/(site)/perfil/page.tsx`:
  - `force-dynamic`; `getCurrentProfile()`; si null → `redirect("/login?from=/perfil")`.
  - Header: avatar (imagen o inicial), `displayName ?? "Usuario"`, rol en español,
    "miembro desde {mes año}".
  - Lista de accesos: Mis favoritos, Sugerir un lugar, Panel admin (solo `role==="admin"`).
  - `<form action={logoutAction}>` con botón "Cerrar sesión".
  - Estilo Tierra (patrón de `/mas`).
- [x] T2 [B] — `pnpm -r typecheck` + build + deploy.

## Verificación final (definition of done)
- [x] AC1 — `/perfil` no da 404 (ruta ƒ /perfil en el build).
- [x] AC2 — Sin sesión → redirect a `/login?from=/perfil`.
- [x] AC3 — Muestra nombre, rol y "miembro desde".
- [x] AC4 — Accesos correctos; admin solo para `role==="admin"`.
- [x] AC5 — "Cerrar sesión" reusa `logoutAction` (→ `/`).
- [x] AC6 — `pnpm -r typecheck` pasa.
