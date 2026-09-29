# Feature Spec — Admin Create Venue

> Documento de **qué** se construye y **por qué**. No describe cómo (eso va en
> `plan.md`). Léelo como contrato: cualquier ambigüedad acá se decide antes de planear.

## 1. Resumen
Un administrador puede crear un nuevo venue desde el panel admin sin tocar la base de
datos directamente. El formulario de creación es análogo al de edición existente
(`/admin/lugares/[slug]/editar`) y redirige al detalle del venue recién creado.

## 2. Motivación
Hoy el único camino para agregar contenido nuevo es correr SQL en Supabase. Eso impide
que el admin opere de forma autónoma. Sin esta feature, la app no es operable en
producción.

## 3. Objetivos (en alcance)
- O1 — Formulario `/admin/lugares/nuevo` que llama al use-case `createVenue` existente.
- O2 — Campos: nombre, slug (editable, con auto-generación desde nombre), descripción,
  categoría, food types, dirección, lat/lng, precio, teléfono, web, Instagram, cover
  image, estado (draft/published/archived), horarios.
- O3 — Al crear con éxito → redirect a `/admin/lugares/[slug]` (detalle admin).
- O4 — Link "Nuevo lugar" en la lista admin `/admin/lugares`.
- O5 — Slug sugerido automáticamente desde el nombre (client-side, editable por el admin).

## 4. No-objetivos (fuera de alcance, declarados)
- N1 — Upload de múltiples imágenes (solo cover image, como en editar).
- N2 — Vista previa del venue antes de publicar (existe `/lugares/[slug]` para eso).
- N3 — Validación de slug de unicidad en tiempo real (el error de duplicado llega al
  submit via ConflictError del use-case).
- N4 — Asignación de horarios desde la creación (el admin puede editarlos luego en
  `/admin/lugares/[slug]/editar`).

## 5. Usuarios y permisos
| Rol      | Lo que puede hacer                                     |
|----------|--------------------------------------------------------|
| visitor  | Nada — no tiene acceso al panel admin.                 |
| editor   | Nada — `requireProfile("admin")` bloquea la ruta.     |
| admin    | Accede a `/admin/lugares/nuevo`, crea venues.          |

## 6. Comportamiento esperado

### Caso feliz
1. Admin navega a `/admin/lugares` → hace clic en "Nuevo lugar".
2. Se carga `/admin/lugares/nuevo` con el formulario vacío.
3. Admin completa nombre; el slug se auto-genera (ej. "La Esquina" → `la-esquina`).
4. Admin ajusta campos opcionales y elige categoría.
5. Admin hace submit → Server Action `createVenueAction`.
6. La acción llama a `createVenue(repo, data)`, sube cover image si viene, y redirige
   a `/admin/lugares/[slug]`.

### Edge cases
- **Slug duplicado**: el use-case devuelve `ConflictError`; el form muestra
  "Ya existe un lugar con ese slug. Elegí uno diferente."
- **Nombre vacío / slug inválido**: validación Zod en el use-case devuelve
  `ValidationError`; el form muestra el mensaje de error.
- **Sin categoría seleccionada**: campo requerido en el form; submit bloqueado por HTML
  required.
- **Cover image demasiado grande**: no se valida en este alcance (N4 no aplica aquí);
  Supabase Storage rechazará archivos > límite configurado.
- **Admin no autenticado**: `requireProfile("admin")` redirige a `/login`.

## 7. Contratos de módulo afectados

### `@haku/core` — sin cambios
El use-case `createVenue(repo, input: CreateVenueInput): Promise<Result<Venue>>` ya
existe y está testeado. `createSupabaseCoreRepository` ya implementa `repo.createVenue`.
No se modifica ningún módulo fuera de `web/`.

### `web/` — archivos nuevos/modificados
- **Nuevo** `web/app/admin/lugares/nuevo/page.tsx` — RSC `force-dynamic`, carga
  categorías + food types, renderiza `<CreateVenueForm>`.
- **Nuevo** `web/app/admin/lugares/nuevo/create-venue-form.tsx` — `"use client"`,
  `useActionState`, auto-generación de slug.
- **Nuevo** `web/app/admin/lugares/nuevo/actions.ts` — `"use server"`,
  `createVenueAction(_prev, formData) → CreateVenueState`, llama a `createVenue`.
- **Modificado** `web/app/admin/lugares/page.tsx` — agregar link/botón "Nuevo lugar"
  apuntando a `/admin/lugares/nuevo`.

### Supabase
Sin migraciones nuevas. RLS existente en `venues` ya cubre: sin política INSERT para
`authenticated` → solo `service_role` puede insertar (via `createAdminSupabase`).

## 8. Criterios de aceptación
- AC1 — Admin ve botón "Nuevo lugar" en `/admin/lugares`.
- AC2 — `/admin/lugares/nuevo` carga el formulario vacío con categorías y food types.
- AC3 — Al escribir el nombre, el slug se auto-genera (slugify client-side).
- AC4 — Submit exitoso → venue creado en DB con status = draft (default) y redirect a
  `/admin/lugares/[slug]`.
- AC5 — Slug duplicado → mensaje de error "Ya existe un lugar con ese slug."
- AC6 — Cover image opcional: si se sube, queda almacenada en Storage y la URL
  se persiste en `venues.cover_image_url`.
- AC7 — Acceso sin sesión admin → redirect a login (guard `requireProfile("admin")`).
- AC8 — Food types y categorías cargan correctamente desde la DB.

## 9. Riesgos y supuestos
- **Supuesto**: `repo.createVenue` ya maneja el insert de `venue_food_types` en la misma
  transacción (o al menos de forma atómica suficiente). Si no, hay riesgo de venue sin
  food types silencioso → verificar en el adapter antes de planear.
- **Riesgo bajo**: auto-generación de slug client-side puede producir slugs que ya
  existen; se resuelve con el error de ConflictError (no requiere check previo).
- **Supuesto**: `createAdminSupabase()` ya está disponible en `web/lib/supabase/admin.ts`
  (confirmado en features anteriores).

## 10. Preguntas abiertas
_(Ninguna — todos los puntos están resueltos por features previas o por el use-case
existente.)_
