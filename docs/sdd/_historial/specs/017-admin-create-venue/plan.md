# Plan — Admin Create Venue

> **Cómo** lo construimos. Se escribe DESPUÉS de aprobar `spec.md`.

## 1. Arquitectura afectada

**Solo `web/`** — ningún módulo de dominio cambia.

- `@haku/core` — `createVenue`, `listCategories`, `listFoodTypes`,
  `createSupabaseCoreRepository` ya exportados. Sin modificaciones.
- `web/lib/supabase/admin.ts` — `createAdminSupabase()` ya disponible.
- `web/lib/auth.ts` — `requireProfile("admin")` ya disponible.
- `web/app/admin/lugares/page.tsx` — link "Nuevo lugar" YA existe apuntando a
  `/admin/lugares/nuevo`. No requiere cambios.

Frontera respetada: `web` llama a `@haku/core` por su API pública únicamente.
Sin nuevas dependencias npm.

## 2. Modelo de datos

Sin migraciones nuevas. La tabla `venues` ya existe con RLS:
- Sin política INSERT para `anon`/`authenticated` — solo `service_role` puede insertar.
- `createAdminSupabase()` usa `service_role` — inserta sin restricciones de RLS.
- `venue_food_types` se inserta en el mismo flow en el adapter existente.

## 3. Diseño de ports y use-cases

No se agregan ports ni use-cases. El use-case existente es suficiente:

```ts
// Ya existe en @haku/core — sin cambios
createVenue(repo: CoreRepository, input: CreateVenueInput): Promise<Result<Venue>>

// CreateVenueInput (definido en create-venue.use-case.ts):
{
  slug: string;          // slugSchema de @haku/shared
  name: string;          // min 2, max 120
  description?: string;
  categorySlug: string;  // requerido
  address?: string;
  location?: { lat: number; lng: number };
  priceRange?: "$" | "$$" | "$$$";
  phone?: string;
  website?: string;      // URL válida
  instagram?: string;
  foodTypeIds?: string[];
  status?: "draft" | "published" | "archived";  // default "draft"
}
```

## 4. Diseño de infraestructura

El adapter `SupabaseCoreRepository.createVenue` ya está implementado. La Server Action:
1. Recibe `FormData` — parsea campos igual que `updateVenueAction`.
2. Si viene cover image — `adminClient.storage.from("venue-images").upload(...)`.
3. Llama `createVenue(repo, data)` donde `repo = createSupabaseCoreRepository(adminClient)`.
   Usar `adminClient` (service_role) tanto para Storage como para el repo, para evitar
   RLS en INSERT de `venues` y `venue_food_types`.
4. Si `!res.ok` — retorna el error al form.
5. Si éxito — `revalidatePath("/admin/lugares")` + `revalidatePath("/lugares")` +
   `redirect(\`/admin/lugares/${res.value.slug}\`)`.

## 5. UI / Server Actions / route handlers (`web`)

### Rutas nuevas

| Ruta | Estrategia | Descripción |
|------|-----------|-------------|
| `/admin/lugares/nuevo` | `force-dynamic` (RSC) | Carga categorías + food types, renderiza `<CreateVenueForm>` |

### Server Action: `createVenueAction`

```
Archivo: web/app/admin/lugares/nuevo/actions.ts
"use server"

createVenueAction(_prev: CreateVenueState, formData: FormData): Promise<CreateVenueState>

1. requireProfile("admin")
2. Parsear formData: slug, name, description, categorySlug, address,
   lat?, lng?, priceRange?, phone?, website?, instagram?, foodTypeIds[], status, coverImage?
3. Si coverImage y size > 0 → adminClient.storage upload → obtener publicUrl
4. adminRepo = createSupabaseCoreRepository(createAdminSupabase())
5. res = await createVenue(adminRepo, { ...data, coverImageUrl? })
6. Si !res.ok:
   - ConflictError → { error: "Ya existe un lugar con ese slug. Elegí uno diferente." }
   - ValidationError → { error: res.error.message }
   - otherwise → { error: "Error inesperado al crear el lugar." }
7. revalidatePath("/admin/lugares"); revalidatePath("/lugares")
8. redirect(`/admin/lugares/${res.value.slug}`)
```

### Componente: `CreateVenueForm`

```
Archivo: web/app/admin/lugares/nuevo/create-venue-form.tsx
"use client" — useActionState(createVenueAction, {})

Props: { categories: Category[]; foodTypes: FoodType[] }

Campos (mismo orden que EditVenueForm):
- name (text, required) — onChange auto-genera slug si slug no fue editado manualmente
- slug (text, required) — editable; se "fija" al primer cambio manual del admin
- description (textarea)
- categorySlug (select, required)
- food types (checkboxes)
- address (text)
- lat + lng (number)
- priceRange (select vacío + $, $$, $$$)
- phone, website, instagram (text)
- coverImage (file, accept image/*)
- status (select: draft/published/archived, default draft)
- submit button con estado pending
- error inline si state.error

Auto-generación de slug (client-side, sin librería):
slugify(name) = name.toLowerCase()
  .normalize("NFD").replace(/[̀-ͯ]/g, "")  // quitar tildes
  .replace(/[^a-z0-9\s-]/g, "")
  .trim().replace(/\s+/g, "-")
```

### Página RSC

```
Archivo: web/app/admin/lugares/nuevo/page.tsx
export const dynamic = "force-dynamic"

1. await requireProfile("admin")
2. supabase = await createServerSupabase()
3. repo = createSupabaseCoreRepository(supabase)
4. Promise.all([listCategories(repo), listFoodTypes(repo)])
5. Render: <CreateVenueForm categories={...} foodTypes={...} />
```

## 6. Estrategia de tests

- Sin use-cases nuevos — no hay tests unitarios nuevos requeridos.
- Los tests existentes de `create-venue.use-case.test.ts` ya cubren el dominio.
- `pnpm -r typecheck` + `pnpm -r test` como gate de cierre.
- Verificación manual: crear venue desde `/admin/lugares/nuevo`, confirmar que aparece en
  la lista y que `/lugares/[slug]` carga correctamente.

## 7. Riesgos del plan

| Riesgo | Probabilidad | Mitigación |
|--------|-------------|------------|
| `createVenue` adapter usa client con anon key → falla INSERT por RLS | Media | Pasar `createAdminSupabase()` como client del repo en la Server Action |
| Slug duplicado | Baja | `ConflictError` ya manejado en el use-case; el form muestra mensaje |
| `venue_food_types` silenciosamente vacío | Baja | El adapter existente ya lo maneja en el mismo client; confirmado en código |

## 8. Orden de implementación

```
T1 — Crear web/app/admin/lugares/nuevo/actions.ts  [B]
     (Server Action createVenueAction)
     |
     +-- T2 — Crear web/app/admin/lugares/nuevo/create-venue-form.tsx  [B]
              (client component, useActionState con la action de T1)
              |
              +-- T3 — Crear web/app/admin/lugares/nuevo/page.tsx  [B]
                       (RSC que renderiza el form de T2)

T4 — Verificar / confirmar link en web/app/admin/lugares/page.tsx  [P]
     (confirmado presente; no requiere cambios)

T5 — Gate: pnpm -r typecheck && pnpm -r test
```
