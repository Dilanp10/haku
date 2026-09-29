# Tasks — Admin Create Venue

> Lista accionable derivada de `plan.md`. Cada tarea: pequeña, testeable, con un
> "hecho" sin ambigüedad. Marcar `[x]` al completar.

## Convenciones
- `T1`, `T2`, ... — orden recomendado.
- `[P]` tarea paralelizable.
- `[B]` bloqueante para otras.

## Tareas

### Bloque 1 — Server Action (bloquea todo lo demás)

- [x] T1 [B] — Crear `web/app/admin/lugares/nuevo/actions.ts`:
  - `"use server"`, exporta `CreateVenueState` y `createVenueAction`.
  - Guard: `requireProfile("admin")`.
  - Parseo de FormData: `slug`, `name`, `description`, `categorySlug`, `address`,
    `lat`, `lng`, `priceRange`, `phone`, `website`, `instagram`, `foodTypeIds[]`,
    `status`, `coverImage` (File).
  - Si `coverImage` y `size > 0` → upload a Storage bucket `venue-images` via
    `createAdminSupabase()`, obtener `publicUrl`.
  - `adminRepo = createSupabaseCoreRepository(createAdminSupabase())`.
  - Llamar `createVenue(adminRepo, { ...data, coverImageUrl? })`.
  - Errores: `ConflictError` → mensaje slug duplicado; `ValidationError` → mensaje
    del issue; unexpected → mensaje genérico.
  - Éxito: `revalidatePath("/admin/lugares")`, `revalidatePath("/lugares")`,
    `redirect(\`/admin/lugares/${res.value.slug}\`)`.
  - **Hecho**: el archivo existe y `pnpm typecheck` en `web` no da errores sobre él.

### Bloque 2 — Componentes (dependen de T1)

- [x] T2 [B] — Crear `web/app/admin/lugares/nuevo/create-venue-form.tsx`:
  - `"use client"`, `useActionState(createVenueAction, {})`.
  - Props: `{ categories: Category[]; foodTypes: FoodType[] }`.
  - Estado local `slugLocked: boolean` — falso hasta que el admin edita el slug
    manualmente.
  - `name` onChange: si `!slugLocked` → auto-genera slug via `slugify(name)`.
  - `slug` onChange: setea `slugLocked = true`.
  - Campos: nombre*, slug*, descripción, categoría* (select), food types (checkboxes),
    dirección, lat, lng, precio (select), teléfono, web, Instagram, cover image (file),
    estado (select, default `draft`).
  - Error inline `state.error` + botón submit deshabilitado mientras `pending`.
  - Función `slugify` inline (sin librería): normaliza NFD, elimina diacríticos,
    reemplaza espacios con `-`, elimina caracteres no alfanuméricos.
  - **Hecho**: el componente renderiza sin errores de tipo; todos los campos nombrados
    coinciden con los que parsea `createVenueAction`.

- [x] T3 [B] — Crear `web/app/admin/lugares/nuevo/page.tsx`:
  - `export const dynamic = "force-dynamic"`.
  - `await requireProfile("admin")`.
  - `createServerSupabase()` + `createSupabaseCoreRepository(supabase)`.
  - `Promise.all([listCategories(repo), listFoodTypes(repo)])`.
  - Renderiza encabezado "Nuevo lugar" + `<CreateVenueForm categories foodTypes />`.
  - **Hecho**: la ruta `/admin/lugares/nuevo` carga sin errores de tipo ni runtime.

### Bloque 3 — Verificación del link existente

- [x] T4 [P] — Confirmar que `web/app/admin/lugares/page.tsx` ya contiene el link
  `href="/admin/lugares/nuevo"` con label "Nuevo lugar".
  - Si ya está (confirmado en plan) → marcar completado sin cambios.
  - Si falta → agregar botón en el `<header>` junto al título.
  - **Hecho**: `/admin/lugares` muestra "Nuevo lugar" apuntando a la ruta correcta.

## Verificación final (definition of done)

- [ ] `pnpm -r typecheck` pasa sin errores.
- [ ] `pnpm -r test` pasa sin errores.
- [ ] AC1 — Botón "Nuevo lugar" visible en `/admin/lugares`.
- [ ] AC2 — `/admin/lugares/nuevo` carga con categorías y food types.
- [ ] AC3 — Auto-generación de slug funciona al escribir el nombre.
- [ ] AC4 — Submit crea el venue y redirige a `/admin/lugares/[slug]`.
- [ ] AC5 — Slug duplicado muestra error "Ya existe un lugar con ese slug."
- [ ] AC6 — Cover image opcional persiste en Storage y en `cover_image_url`.
- [ ] AC7 — Sin sesión admin → redirect al login.
- [ ] `BACKLOG.md` actualizado con Fase 29.
