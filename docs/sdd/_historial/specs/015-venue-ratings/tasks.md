# Tasks — Venue Ratings

> Lista accionable derivada de `plan.md`. Cada tarea: pequeña, testeable, con un
> "hecho" sin ambigüedad. Marcar `[x]` al completar.

## Convenciones
- `T1`, `T2`, ... — orden recomendado.
- `[P]` tarea paralelizable.
- `[B]` bloqueante para otras.

## Tareas

### Bloque 1 — Infra (secuencial, bloquea al Bloque 2)

- [x] T1 [B] — Crear `supabase/migrations/0009_venue_ratings.sql`:
  - Tabla `venue_ratings (user_id, venue_id, rating smallint CHECK 1–5, created_at, updated_at)` con PK compuesta.
  - FK a `auth.users` y `public.venues` con `ON DELETE CASCADE`.
  - RLS habilitada con 4 políticas: select/insert/update/delete solo el propio `user_id`.
  - Vista `venue_rating_stats` con `AVG(rating)` redondeado a 1 decimal y `COUNT(*)`.
  - `GRANT SELECT ON venue_rating_stats TO anon, authenticated`.

- [x] T2 [B] — Actualizar `shared/src/types/database.ts`:
  - Agregar `venue_ratings` a `Database.public.Tables` con Row/Insert/Update/Relationships.
  - Cambiar `Views` de `{[_ in never]: never}` a un objeto con `venue_rating_stats` (Row + Relationships).
  - Hecho cuando `pnpm typecheck` pasa en `@haku/shared`.

### Bloque 2 — Web (paralelos entre sí, dependen de Bloque 1)

- [x] T3 [P] — Crear `web/app/api/venues/[slug]/my-rating/route.ts`:
  - `force-dynamic`.
  - `GET`: resuelve `venue_id` desde `venues` por slug. Si anon → `{ rating: null }`.
  - Lee `rating` de `venue_ratings` para `(user_id, venue_id)` con `.maybeSingle()`.
  - Retorna `{ rating: number | null }`.

- [x] T4 [P] — Ampliar `web/app/(site)/lugares/[slug]/actions.ts` con `rateVenueAction`:
  - Firma: `rateVenueAction(venueId: string, rating: number, slug: string): Promise<RateResult>`.
  - Validar `rating` ∈ [1, 5] con Zod; si falla → `{ ok: false, error: 'INVALID_RATING' }`.
  - `getUser()` → si no hay sesión → `{ ok: false, error: 'UNAUTHENTICATED' }`.
  - UPSERT en `venue_ratings` con `onConflict: 'user_id,venue_id'`.
  - `revalidatePath('/lugares/' + slug)`.
  - Retorna `{ ok: true, rating }` o `{ ok: false, error: string }`.

- [x] T5 [P] — Crear `web/app/(site)/lugares/[slug]/rating-display.tsx`:
  - Componente presentacional (server o client, sin estado).
  - Props: `averageRating: number | null`, `ratingCount: number`.
  - Render: estrella + "4.2 (17 votos)" si hay ratings; "Sin puntuaciones aún" si null/0.

- [x] T6 [P] — Crear `web/app/(site)/lugares/[slug]/rating-picker.tsx`:
  - `"use client"`.
  - Props: `venueId: string`, `slug: string`, `hasSession: boolean`.
  - Si `!hasSession`: 5 estrellas outline deshabilitadas + texto "Iniciá sesión para puntuar".
  - Si `hasSession`: `useEffect` fetch `GET /api/venues/${slug}/my-rating` → `myRating: number | null`.
  - `useTransition` + estado optimista: clic en estrella K → `setMyRating(K)` → `rateVenueAction(venueId, K, slug)`.
  - Si `ok: false` → revertir + error inline.
  - Render: estrella rellena para i ≤ myRating, outline para i > myRating (o todos outline si null).

- [x] T7 [B] — Actualizar `web/app/(site)/lugares/[slug]/page.tsx`:
  - Añadir query de stats: `.from("venue_rating_stats").select("average_rating, rating_count").eq("venue_id", venue.id).maybeSingle()`.
  - Importar y renderizar `<RatingDisplay averageRating={...} ratingCount={...} />` junto al nombre del venue.
  - Importar y renderizar `<RatingPicker venueId={venue.id} slug={slug} hasSession={!!profile} />`.
  - Obtener `profile` en esta página con `getCurrentProfile()` (ya disponible en `@/lib/auth`).

- [x] T8 [P] — Actualizar `web/app/admin/lugares/[slug]/page.tsx`:
  - Añadir query de stats al render (mismo patrón que T7).
  - Agregar stat card "Rating" mostrando promedio + conteo (o "—" si sin votos).

## Verificación final (definition of done)
- [x] `pnpm -r typecheck` pasa sin errores.
- [x] `pnpm -r test` pasa sin errores.
- [ ] AC1/AC2 — votar y cambiar voto como usuario autenticado funciona.
- [ ] AC3 — promedio visible en página pública.
- [ ] AC4 — usuario anon ve estrellas deshabilitadas.
- [ ] AC5 — rating fuera de rango rechazado por la SA.
- [ ] AC7 — panel admin muestra promedio + conteo.
- [x] `BACKLOG.md` actualizado con Fase 27.
