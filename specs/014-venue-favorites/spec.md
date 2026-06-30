# Feature Spec — Venue Favorites

> Documento de **qué** se construye y **por qué**. No describe cómo (eso va en
> `plan.md`). Léelo como contrato: cualquier ambigüedad acá se decide antes de planear.

## 1. Resumen
Los usuarios autenticados pueden guardar venues como favoritos (corazón). Una página
`/perfil/favoritos` muestra los venues guardados. El toggle es instantáneo (optimistic
UI) y persiste en Supabase con RLS estricta (cada usuario solo ve los suyos).

## 2. Motivación
El descubrimiento de lugares es el core de Haku, pero no hay forma de que un usuario
vuelva a un venue que le gustó sin buscarlo de nuevo. Los favoritos cierran el loop:
descubrir → guardar → volver. Es engagement directo y da señal de popularidad futura.

## 3. Objetivos (en alcance)
- O1 — Tabla `venue_saves` con RLS: cada usuario gestiona solo sus registros.
- O2 — Botón corazón en la página de detalle de venue (`/lugares/[slug]`).
- O3 — Página `/perfil/favoritos` con lista de venues guardados del usuario actual.
- O4 — Toggle vía Server Action con revalidación (sin API route).
- O5 — Estado del corazón visible sin latencia perceptible (optimistic update).

## 4. No-objetivos (fuera de alcance, declarados)
- N1 — Corazón en las cards de listado (`/lugares`) — se puede agregar después, pero
  requiere resolver el estado de N cards en batch (query `venue_saves` para todos los
  venues de la página). Queda fuera de esta iteración.
- N2 — Conteo público de favoritos por venue (popularidad). Es una feature separada.
- N3 — Favoritos de eventos. Solo venues por ahora.
- N4 — Notificaciones sobre venues favoritos (cambios de estado, nuevos eventos cerca).

## 5. Usuarios y permisos
| Rol | Lo que puede hacer |
|---|---|
| anon (sin sesión) | Ve el botón corazón deshabilitado con tooltip "Iniciá sesión para guardar". No puede acceder a `/perfil/favoritos` (redirect a `/login`). |
| visitor | Toggle favorito en detalle de venue. Ver y gestionar su lista en `/perfil/favoritos`. |
| editor | Igual que visitor. |
| admin | Igual que visitor. |

## 6. Comportamiento esperado

### Caso feliz — Guardar un favorito
1. Usuario autenticado visita `/lugares/cafe-central`.
2. Ve un botón corazón (outline) junto al nombre del venue.
3. Hace clic → el corazón se llena inmediatamente (optimistic).
4. Server Action inserta en `venue_saves`. Si falla, el corazón vuelve a outline y se
   muestra un toast/mensaje de error.
5. El usuario visita `/perfil/favoritos` y ve "Café Central" en su lista.

### Caso feliz — Quitar un favorito
1. Usuario visita `/lugares/cafe-central` (ya guardado).
2. Ve el corazón lleno. Hace clic → se vacía inmediatamente.
3. Server Action elimina el registro de `venue_saves`.
4. En `/perfil/favoritos` el venue ya no aparece.

### Edge cases
- **Usuario no autenticado**: el botón corazón aparece con estilo deshabilitado. Al
  hacer clic, navega a `/login?from=/lugares/{slug}` (redirect-back después del login).
- **Venue no publicado**: el botón no se muestra (la página pública solo resuelve
  venues publicados via RLS; no hay detalle público de drafts/archived).
- **Doble clic rápido**: el optimistic update es idempotente en la UI. La Server Action
  usa upsert/delete y es segura ante race conditions (PK compuesta previene duplicados).
- **Lista vacía**: `/perfil/favoritos` muestra un estado vacío con CTA "Descubrí lugares"
  que lleva a `/lugares`.
- **Venue archivado después de guardado**: el venue sigue en `venue_saves` pero la
  query de la lista filtra por `status = 'published'` via join + RLS, así que no aparece.

### Errores visibles al usuario
- "No pudimos guardar tu favorito. Intentá de nuevo." — si la Server Action falla.
- Redirect a `/login` si intenta acceder a `/perfil/favoritos` sin sesión.

## 7. Contratos de módulo afectados

### `supabase/migrations/0008_venue_saves.sql`
```sql
CREATE TABLE public.venue_saves (
  user_id uuid NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  venue_id uuid NOT NULL REFERENCES public.venues (id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, venue_id)
);

ALTER TABLE public.venue_saves ENABLE ROW LEVEL SECURITY;

-- Cada usuario solo ve sus propios saves.
CREATE POLICY "venue_saves_own_select"
  ON public.venue_saves FOR SELECT
  USING (auth.uid() = user_id);

-- Cada usuario solo inserta sus propios saves.
CREATE POLICY "venue_saves_own_insert"
  ON public.venue_saves FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Cada usuario solo borra sus propios saves.
CREATE POLICY "venue_saves_own_delete"
  ON public.venue_saves FOR DELETE
  USING (auth.uid() = user_id);
```

### `@haku/shared` — `database.ts`
Agregar tipo `venue_saves` a `Database.public.Tables`:
```ts
venue_saves: {
  Row: { user_id: string; venue_id: string; created_at: string };
  Insert: { user_id: string; venue_id: string; created_at?: string };
  Update: Partial<...Insert>;
};
```

### `@haku/core` — Sin cambios
Favoritos es un concern cross-domain (auth × core). No toca domain ni ports de core.
La lógica vive en `web/` como composition root.

### `@haku/auth` — Sin cambios
No se agregan ports ni use-cases. El auth se usa vía `getCurrentProfile()` existente.

### `web/` — Nuevos archivos
- `web/app/(site)/lugares/[slug]/save-button.tsx` — Client component: corazón con
  toggle optimista. Props: `{ venueId: string; slug: string; initialSaved: boolean }`.
  Si no hay sesión (prop `loggedIn: false`), clic navega a `/login?from=/lugares/{slug}`.
- `web/app/(site)/lugares/[slug]/actions.ts` — Server Action `toggleFavoriteAction(venueId)`:
  - Lee `auth.uid()` del Supabase client (sesión del usuario).
  - Chequea si existe el registro en `venue_saves`.
  - Si existe → delete. Si no → insert.
  - Retorna `{ saved: boolean }`.
  - `revalidatePath('/perfil/favoritos')`.
- `web/app/(site)/perfil/favoritos/page.tsx` — RSC `force-dynamic`:
  - Requiere sesión (redirect si anon).
  - Query: `venue_saves` join `venues` where `status = 'published'`, ordered by
    `venue_saves.created_at DESC`.
  - Renderiza lista de VenueCards o estado vacío.
- `web/app/(site)/lugares/[slug]/page.tsx` — Cambio: en el RSC, si hay sesión, consultar
  si el venue está en `venue_saves` del usuario actual. Pasar `initialSaved` y `loggedIn`
  al `SaveButton`.

## 8. Criterios de aceptación
- AC1 — Usuario autenticado puede guardar un venue desde `/lugares/[slug]` y el corazón
  se llena visualmente sin esperar la respuesta del servidor.
- AC2 — Usuario autenticado puede quitar un venue guardado; el corazón vuelve a outline.
- AC3 — `/perfil/favoritos` muestra solo los venues guardados del usuario actual, solo
  los que están publicados.
- AC4 — Usuario anon ve el corazón deshabilitado; al hacer clic es redirigido a login.
- AC5 — RLS: un usuario no puede ver ni borrar los saves de otro (verificable con
  queries directas usando distinta sesión).
- AC6 — La PK compuesta `(user_id, venue_id)` previene duplicados.
- AC7 — `pnpm -r typecheck` pasa sin errores.
- AC8 — `pnpm -r test` pasa sin errores (fakes actualizados si hace falta).
- AC9 — Estado vacío en `/perfil/favoritos` muestra CTA con link a `/lugares`.

## 9. Riesgos y supuestos
- **Riesgo**: la página de detalle público usa ISR (`revalidate = 600`). El estado del
  corazón (guardado o no) depende del usuario, así que no se puede cachear en ISR.
  **Mitigación**: el `SaveButton` es un client component que recibe `initialSaved` del
  RSC. En ISR, el RSC no tiene sesión → `initialSaved` sería siempre `false` y
  `loggedIn` siempre `false`. El client component puede hacer un fetch en `useEffect`
  para resolver el estado real del usuario si está logueado. Alternativa: cambiar la
  página a `force-dynamic` (rompe ISR). **Decisión**: mantener ISR; el `SaveButton`
  siempre renderiza con `initialSaved=false` del RSC, y si el usuario está logueado,
  hace un fetch ligero (`GET /api/venues/[slug]/saved`) en mount para conocer el estado
  real. Esto evita un flash incorrecto del corazón vacío en un venue guardado por máximo
  ~200ms (el tiempo del fetch).
- **Riesgo**: el botón heart agrega complejidad visual al detalle. **Mitigación**: es un
  ícono pequeño junto al nombre, estilo consistente con la UI existente.
- **Supuesto**: `auth.uid()` está disponible en el Supabase client de Server Actions
  cuando el usuario está logueado (ya funciona en admin). Si el middleware de sesión
  fallara, la Server Action retorna error genérico.

## 10. Preguntas abiertas
Ninguna. Todas las decisiones están cerradas.
