# Plan — Venue Favorites

> **Cómo** lo construimos. Escrito después de aprobar `spec.md`.

## 1. Arquitectura afectada

- **`@haku/shared`** — `database.ts`: agregar `venue_saves` a `Database.public.Tables`.
- **`supabase/migrations/`** — nuevo `0008_venue_saves.sql`.
- **`@haku/web`** — nuevos archivos y cambios en página de detalle.

Sin dependencias npm nuevas. Sin cambios a `@haku/core`, `@haku/auth` ni `@haku/events`.

**Frontera respetada**: favoritos es cross-domain (auth.users × core.venues). La lógica
vive en `web/` como composition root; los módulos de dominio no se tocan. Las queries a
`venue_saves` van directas desde Server Actions y route handlers en `web/` usando el
cliente Supabase (no hay port/use-case nuevo).

## 2. Modelo de datos

### `supabase/migrations/0008_venue_saves.sql`
```sql
CREATE TABLE public.venue_saves (
  user_id    uuid NOT NULL REFERENCES auth.users  (id) ON DELETE CASCADE,
  venue_id   uuid NOT NULL REFERENCES public.venues (id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, venue_id)
);

ALTER TABLE public.venue_saves ENABLE ROW LEVEL SECURITY;

CREATE POLICY "venue_saves_own_select" ON public.venue_saves
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "venue_saves_own_insert" ON public.venue_saves
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "venue_saves_own_delete" ON public.venue_saves
  FOR DELETE USING (auth.uid() = user_id);
```

PK compuesta `(user_id, venue_id)` previene duplicados en DB nivel.

### `shared/src/types/database.ts`
Agregar tabla `venue_saves`:
```ts
venue_saves: {
  Row:    { user_id: string; venue_id: string; created_at: string };
  Insert: { user_id: string; venue_id: string; created_at?: string };
  Update: Partial<...Insert>;
};
```

## 3. Ports y use-cases

**No se agregan ports ni use-cases**. Favoritos tiene lógica trivial (insert/delete/select)
sin reglas de negocio que testear con fakes. Las queries van directas desde `web/` vía
el cliente Supabase con la sesión del usuario (anon key + RLS hacen el trabajo).

## 4. Diseño de infraestructura / web

### 4a. Route handler — `GET /api/venues/[slug]/saved`

```
web/app/api/venues/[slug]/saved/route.ts
```
- `force-dynamic`.
- Lee `slug` de params, resuelve `venue_id` desde `venues` table.
- Chequea si existe `venue_saves` con `user_id = auth.uid()` y el `venue_id`.
- Retorna `{ saved: boolean }`. Si no hay sesión: `{ saved: false }`.
- Usa `createServerSupabase()` (anon key con sesión del usuario vía cookies).

### 4b. Server Action — `toggleFavoriteAction`

```
web/app/(site)/lugares/[slug]/actions.ts
```
- `"use server"`.
- Parámetro: `venueId: string`.
- Crea `createServerSupabase()`, consulta `venue_saves` por `(user_id, venue_id)`.
- Si existe → DELETE. Si no → INSERT.
- `revalidatePath('/perfil/favoritos')`.
- Retorna `{ ok: true, saved: boolean }` o `{ ok: false, error: string }`.
- Si no hay sesión → retorna `{ ok: false, error: 'UNAUTHENTICATED' }`.

### 4c. Client component — `SaveButton`

```
web/app/(site)/lugares/[slug]/save-button.tsx
```
- `"use client"`.
- Props: `{ venueId: string; slug: string }`.
- Estado interno: `saved: boolean | null` (null = loading).
- `useEffect` al montar: fetch `GET /api/venues/[slug]/saved` → setea `saved`.
  Si el fetch falla (no auth, red), `saved` queda `false`.
- `handleToggle`: optimistic update (`setSaved(!saved)`) → llama `toggleFavoriteAction`.
  Si `action` retorna `ok: false`, revierte el estado y muestra mensaje inline.
- Renderizado:
  - Si `saved === null` → corazón outline gris (loading state, pointer-events none).
  - Si `saved === false` → `<Heart>` outline, `aria-label="Guardar favorito"`.
  - Si `saved === true` → `<Heart>` fill rojo, `aria-label="Quitar de favoritos"`.
- El botón nunca redirige a `/login` — si la Server Action devuelve UNAUTHENTICATED,
  muestra el mismo mensaje de error. El usuario anon verá el corazón outline y al hacer
  clic recibirá el error (UX simple sin redirect desde el componente).

> **Nota**: La decisión del spec de redirigir a `/login` si no hay sesión se simplifica:
> el `SaveButton` maneja el error de SA retornando el texto "Iniciá sesión para guardar".
> No se necesita un prop `loggedIn` adicional. El componente es siempre el mismo.

### 4d. Cambio en `web/app/(site)/lugares/[slug]/page.tsx`

Agregar `<SaveButton venueId={venue.id} slug={slug} />` junto al `<h1>` del nombre.
La página sigue con `revalidate = 600` — el estado del corazón lo resuelve el
cliente en mount vía fetch, no el RSC.

### 4e. Nueva página — `/perfil/favoritos`

```
web/app/(site)/perfil/favoritos/page.tsx
```
- `force-dynamic`.
- Llama `getCurrentProfile()`. Si null → `redirect('/login?from=/perfil/favoritos')`.
- Query con `createServerSupabase()`:
  ```sql
  SELECT venue_saves.*, venues.*
  FROM venue_saves
  JOIN venues ON venues.id = venue_saves.venue_id
  WHERE venues.status = 'published'
  ORDER BY venue_saves.created_at DESC
  ```
  En Supabase-js: `.from('venue_saves').select('venue_id, created_at, venues(*)')`.
  La RLS de `venue_saves` filtra automáticamente por `user_id = auth.uid()`.
  La RLS de `venues` filtra por `status = 'published'`.
- Renderiza lista de venues (cards simples con nombre + categoría + link).
- Estado vacío: mensaje + botón "Descubrí lugares" → `/lugares`.

### 4f. Navegación — link a Favoritos

Agregar link "Mis favoritos" en la `SiteNav` visible solo cuando hay sesión.
Se carga el perfil en el RSC de la nav o se lee desde un server-only helper.

## 5. Estrategia de tests

- No hay use-cases nuevos → no hay tests unitarios nuevos.
- `pnpm -r typecheck` + `pnpm -r test` en verde son el gate de calidad.
- AC5 (RLS) se verifica manualmente con Supabase local.

## 6. Riesgos del plan

- **ISR + estado por usuario**: el RSC de `/lugares/[slug]` corre con ISR (sin sesión).
  El `SaveButton` resuelve el estado real vía fetch en mount — hay un flash de ~200ms
  con corazón en estado "loading" (gris). Es aceptable; es el mismo tradeoff que el
  `ViewCounter`. Alternativamente se podría pasar el estado desde el RSC si la página
  fuera `force-dynamic`, pero rompe el ISR de toda la página.
- **Double-click race**: el `handleToggle` en `SaveButton` debe deshabilitar el botón
  mientras la Server Action está en vuelo (usar `useTransition` de React).
- **`venue_saves` join Supabase-js**: el selector
  `.select('venue_id, created_at, venues(*)')` en una tabla con FK a `venues` funciona
  porque Supabase infiere la relación. Si el alias de la FK no es estándar, habrá que
  especificar `venues!venue_saves_venue_id_fkey(*)`.

## 7. Orden de implementación

```
1. supabase/migrations/0008_venue_saves.sql
2. shared/src/types/database.ts — agregar venue_saves
3. web/app/api/venues/[slug]/saved/route.ts (GET — resuelve saved state)
4. web/app/(site)/lugares/[slug]/actions.ts (Server Action toggleFavoriteAction)
5. web/app/(site)/lugares/[slug]/save-button.tsx (client component)
6. web/app/(site)/lugares/[slug]/page.tsx — agregar <SaveButton>
7. web/app/(site)/perfil/favoritos/page.tsx (nueva página)
8. web/components/site-nav.tsx — link "Mis favoritos" si hay sesión
```

Pasos 1–2 son de shared/infra y bloquean a 3–8.
Pasos 3–8 pueden ir en paralelo una vez listos 1–2.
