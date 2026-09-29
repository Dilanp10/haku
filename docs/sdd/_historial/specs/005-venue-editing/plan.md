# Plan — Venue Editing

## 1. Arquitectura afectada
- `@haku/core`: + use-case `updateVenue` + port method + adapter.
- `@haku/web`: nuevas páginas `/admin/lugares` y `/admin/lugares/[slug]/editar`
  + Server Action.
- Sin cambios en `@haku/auth`, `@haku/events`, `@haku/shared`.

## 2. Modelo de datos
Sin migración nueva. Se aprovecha el enum `content_status` existente y RLS de
`venues_admin_all` (admin ve todo).

## 3. Ports y use-cases
```ts
// @haku/core
interface UpdateVenueData {
  name?: string;
  description?: string | null;       // null = limpiar
  categorySlug?: string;             // resuelto a category_id en adapter
  address?: string | null;
  location?: GeoPoint | null;
  priceRange?: PriceRange | null;
  status?: "draft" | "published" | "archived";
}
interface CoreRepository {
  ...
  updateVenue(id: string, data: UpdateVenueData): Promise<Venue>; // NUEVO
}
updateVenue(repo, input: { id; ...UpdateVenueData }): Promise<Result<Venue>>;
```
Semántica:
- `undefined` = no cambia (la clave no se incluye en el UPDATE).
- `null` (donde aplica) = limpiar el valor.

## 4. Infraestructura
- Adapter `updateVenue`:
  - Si `categorySlug` viene: resolver a `category_id` (igual que en `createVenue`).
  - Construir el patch solo con las claves presentes (sin undefined).
  - `client.from('venues').update(patch).eq('id', id).select('*').maybeSingle()`.
  - Si `data === null` (no devolvió fila) → `NotFoundError`.
- RLS hace el trabajo de autorización en la base.

## 5. UI / Server Actions
- `/admin/lugares` (RSC, dynamic): `listVenues(repo, { pagination })` — admin ve
  todos los estados por RLS. Filas con badge de estado + link editar.
- `/admin/lugares/[slug]/editar` (RSC, dynamic):
  - `getVenueBySlug(repo, { slug })` para pre-rellenar.
  - `listCategories(repo)` para el `<select>` de categorías.
  - 404 si no existe.
- Server Action `updateVenueAction`:
  - `requireProfile('admin')`.
  - Construye `UpdateVenueData` parseando el FormData (omite las claves vacías sin
    cambio).
  - `updateVenue(repo, input)`.
  - `revalidatePath('/lugares')` + `revalidatePath('/lugares/<slug>')` +
    `redirect('/lugares/<slug>')`.

## 6. Tests
- Unit `update-venue.use-case.test.ts`:
  - Id no-UUID → `ValidationError`.
  - Sin id → `ValidationError`.
  - Adapter devuelve `NotFoundError` → se propaga.
  - Happy path con un campo cambiado.
- Actualizar los `fakeRepo` existentes (de tests de `listVenues` y `createVenue`)
  para satisfacer el nuevo método del port.

## 7. Riesgos
- `categorySlug` ahora también puede usarse para fallar la edición (categoría
  inexistente) → `ConflictError` específico, igual que en createVenue.
- Form HTML envía strings para todo; el parser server-side normaliza a tipos
  dom (number para lat/lng, enum para precio/estado, "" → undefined).

## 8. Orden
1. `UpdateVenueData` en port + método `updateVenue` en port.
2. Use-case `updateVenue` con Zod + Result.
3. Adapter `updateVenue` (resuelve categoría, construye patch parcial).
4. Tests del use-case + actualizar fakes existentes.
5. Export en `@haku/core/src/index.ts`.
6. `/admin/lugares` (lista RSC).
7. `/admin/lugares/[slug]/editar` (page + form + action).
8. Link en `/admin/page.tsx` + nav del layout.
