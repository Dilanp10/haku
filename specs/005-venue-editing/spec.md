# Feature Spec — Venue Editing

> Estado: **en implementación** (Fase 4 — completa el CRUD admin de venues).

## 1. Resumen
Editar venues existentes desde el admin: nombre, descripción, categoría, dirección,
ubicación, precio, estado (incluyendo archivar). Listado admin con todos los estados.

## 2. Motivación
Fase 2 entregó "crear venue" pero no "editarlo". Sin edición, cada typo o cambio de
precio exige tocar la BD a mano. La feature cierra el loop de gestión.

## 3. Objetivos
- O1 — `/admin/lugares` lista TODOS los venues (draft + published + archived).
- O2 — `/admin/lugares/[slug]/editar` con formulario pre-rellenado + Server Action.
- O3 — Cambio de estado (publish / archive / volver a draft) desde el mismo form.
- O4 — Revalidar ISR de `/lugares` y `/lugares/[slug]` tras editar.

## 4. No-objetivos
- N1 — Cambiar el `slug` (URLs estables; si se necesita, feature aparte).
- N2 — Borrado físico de venues (se usa `status='archived'`).
- N3 — Historial / auditoría de cambios.
- N4 — Edición de food_types (queda en backlog).

## 5. Usuarios y permisos
| Rol     | Puede |
|---------|-------|
| visitor | nada nuevo. Sigue viendo solo `published` en `/lugares`. |
| admin   | listar y editar cualquier venue, cambiar su estado. |

## 6. Comportamiento esperado
- `/admin/lugares` lista con badge de estado y link "Editar".
- Form de edición pre-rellena todos los campos editables.
- Submit con cambios válidos redirige a `/lugares/[slug]` y revalida ISR.
- Submit con errores muestra mensaje inline; no redirect.
- Cambiar estado a `archived` saca el venue de `/lugares` (RLS oculta archived
  de la lectura pública).
- Visitor SIN sesión accediendo a `/admin/lugares` o el form → `/login?from=admin`.

## 7. Contratos de módulo
- `@haku/core` API nueva:
  - Use-case `updateVenue(repo, { id, ...data })` con Zod (todos los campos opcionales
    excepto `id`).
  - Port: método `updateVenue(id: string, data: UpdateVenueData): Promise<Venue>`.
  - Tipo `UpdateVenueData`.
- Sin cambios en otros módulos.

## 8. Criterios de aceptación
- AC1 — `pnpm -r typecheck` y `pnpm -r test` ✅ (tests nuevos para `updateVenue`).
- AC2 — Visitor SIN sesión → redirect a `/login` (middleware ya lo cubre).
- AC3 — Admin edita un venue y los cambios aparecen en `/lugares/[slug]` (post-revalidate).
- AC4 — Cambiar a `archived` oculta el venue de `/lugares` y `/lugares/[slug]` (RLS).
- AC5 — Slug no es editable en la UI (campo solo-lectura).

## 9. Riesgos
- Update con `categorySlug` inválido → adapter mapea a `ConflictError`.
- Race entre edición y RLS: si admin se downgradea durante la sesión, el siguiente
  submit falla en RLS (defensa real). UX: 403 visible.

## 10. Decisiones (resueltas)
- Slug inmutable (no editable en la UI).
- Borrado lógico vía `status='archived'`.
- Cambio de estado se hace dentro del mismo formulario de edición (no botones de
  acción rápida; se puede agregar más adelante si la UX lo pide).
