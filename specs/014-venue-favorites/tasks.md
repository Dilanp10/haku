# Tasks — Venue Favorites

> Lista accionable derivada de `plan.md`. Cada tarea: pequeña, testeable, con un
> "hecho" sin ambigüedad. Marcar `[x]` al completar.

## Convenciones
- `T1`, `T2`, ... — orden recomendado.
- `[P]` tarea paralelizable.
- `[B]` bloqueante para otras.

## Tareas

### Bloque 1 — Infra (secuencial, bloquea al Bloque 2)

- [x] T1 [B] — Crear `supabase/migrations/0008_venue_saves.sql`:
  - Tabla `venue_saves (user_id, venue_id, created_at)` con PK compuesta.
  - FK a `auth.users` y `public.venues` con `ON DELETE CASCADE`.
  - RLS habilitada con 3 políticas: select/insert/delete solo el propio `user_id`.

- [x] T2 [B] — Actualizar `shared/src/types/database.ts`:
  - Agregar `venue_saves` a `Database.public.Tables` con `Row`, `Insert`, `Update`.
  - Hecho cuando `pnpm -r typecheck` pasa en `@haku/shared`.

### Bloque 2 — Web (paralelos entre sí, dependen de Bloque 1)

- [x] T3 [P] — Crear `web/app/api/venues/[slug]/saved/route.ts`:
  - `force-dynamic`.
  - `GET`: resuelve `venue_id` desde `venues` por slug. Chequea existencia en
    `venue_saves` para el usuario actual (`auth.uid()`).
  - Retorna `{ saved: boolean }`. Si no hay sesión → `{ saved: false }`.
  - Usa `createServerSupabase()` (anon key + cookies de sesión).

- [x] T4 [P] — Crear `web/app/(site)/lugares/[slug]/actions.ts`:
  - `"use server"`.
  - `toggleFavoriteAction(venueId: string)`:
    - Obtiene sesión via `createServerSupabase()`.
    - Si no hay sesión → retorna `{ ok: false, error: 'UNAUTHENTICATED' }`.
    - Chequea si existe el registro en `venue_saves`.
    - Si existe → DELETE. Si no → INSERT.
    - `revalidatePath('/perfil/favoritos')`.
    - Retorna `{ ok: true, saved: boolean }` o `{ ok: false, error: string }`.

- [x] T5 [P] — Crear `web/app/(site)/lugares/[slug]/save-button.tsx`:
  - `"use client"`.
  - Props: `{ venueId: string; slug: string }`.
  - Estado `saved: boolean | null` (null = cargando).
  - `useEffect`: fetch `GET /api/venues/${slug}/saved` al montar → setea `saved`.
    Error de red → `saved = false`.
  - `useTransition` para deshabilitar el botón mientras la SA está en vuelo.
  - `handleToggle`: optimistic `setSaved(!saved)` → llama `toggleFavoriteAction`.
    Si `ok: false` → revierte + muestra error inline (`UNAUTHENTICATED` → "Iniciá sesión para guardar").
  - Render: `null → Heart outline gris deshabilitado`, `false → Heart outline`,
    `true → Heart relleno rojo`. Ícono `Heart` de `lucide-react`.

- [x] T6 [P] — Actualizar `web/app/(site)/lugares/[slug]/page.tsx`:
  - Importar `SaveButton`.
  - Agregar `<SaveButton venueId={venue.id} slug={slug} />` inline junto al `<h1>`
    del nombre (en el `<header>`, después del `<h1>`).
  - Sin cambios al `revalidate = 600` (ISR se mantiene).

- [x] T7 [P] — Crear `web/app/(site)/perfil/favoritos/page.tsx`:
  - `force-dynamic`.
  - `getCurrentProfile()` → si null, `redirect('/login?from=/perfil/favoritos')`.
  - Query: `.from('venue_saves').select('venue_id, created_at, venues(*)')` ordenado
    por `created_at desc`. La RLS filtra por `user_id` y `status = 'published'`
    automáticamente.
  - Renderiza lista: card simple por venue (nombre, slug, categoría, link a `/lugares/{slug}`).
  - Estado vacío: "Todavía no guardaste ningún lugar." + botón → `/lugares`.

- [x] T8 [P] — Actualizar `web/components/site-nav.tsx`:
  - Cargar el perfil del usuario actual desde el RSC de la nav (o via `getCurrentProfile()`).
  - Si hay sesión → mostrar link "Mis favoritos" → `/perfil/favoritos`.
  - Si no hay sesión → no mostrar el link.

## Verificación final (definition of done)
- [x] `pnpm -r typecheck` pasa sin errores.
- [x] `pnpm -r test` pasa sin errores.
- [ ] AC1/AC2 — toggle optimista funciona (verificar manualmente en Supabase local).
- [ ] AC3 — `/perfil/favoritos` solo muestra venues publicados del usuario actual.
- [ ] AC4 — usuario anon ve mensaje "Iniciá sesión para guardar" al hacer clic.
- [ ] AC9 — estado vacío con CTA a `/lugares`.
- [x] `BACKLOG.md` actualizado con Fase 26.
