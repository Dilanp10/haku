# Feature Spec — Venue Ratings

> Documento de **qué** se construye y **por qué**. No describe cómo (eso va en
> `plan.md`). Léelo como contrato: cualquier ambigüedad acá se decide antes de planear.

## 1. Resumen
Los usuarios autenticados pueden puntuar un venue con 1 a 5 estrellas. La página pública
de detalle muestra el promedio y el total de votos. Los admins ven esa métrica en el
panel. Cada usuario puede cambiar su puntuación (upsert), pero no puede votar más de una
vez por venue.

## 2. Motivación
El descubrimiento hiperlocal mejora cuando los usuarios ven señales de calidad rápidas.
Un rating visible en la página de detalle da contexto antes de visitar un lugar, y
genera engagement activo (el usuario contribuye en lugar de solo consumir).

## 3. Objetivos (en alcance)
- O1 — Tabla `venue_ratings` con upsert y RLS per-user.
- O2 — `RatingPicker` (5 estrellas) en la página pública del venue; muestra la nota del
  usuario actual y permite cambiarla.
- O3 — Promedio y conteo de ratings visible en la página pública del venue (debajo del
  nombre o en el sidebar).
- O4 — Promedio visible en el panel admin (detalle del venue).

## 4. No-objetivos (fuera de alcance, declarados)
- N1 — Comentarios / texto de reseña.
- N2 — Moderación de ratings.
- N3 — Feed público de "quién votó qué".
- N4 — Ratings de eventos.
- N5 — Ranking/ordenamiento de venues por rating en el listado (puede venir después).

## 5. Usuarios y permisos
| Rol      | Lo que puede hacer                                              |
|----------|----------------------------------------------------------------|
| visitor  | Ver promedio y total de ratings. No puede votar.               |
| editor   | Votar (upsert propio). Ver su propia puntuación.               |
| admin    | Votar (upsert propio). Ver su propia puntuación + métricas en admin panel. |

> "editor" es el rol mínimo para votar; cualquier usuario autenticado tiene al menos
> ese rol (visitor es el estado pre-login).

## 6. Comportamiento esperado

### Caso feliz — usuario autenticado vota por primera vez
1. El usuario entra a `/lugares/{slug}`.
2. Debajo del nombre se muestran las estrellas: 5 outline grises si aún no votó,
   más el promedio global (`⭐ 4.2 (17 votos)`).
3. El usuario hace clic en la 4ª estrella.
4. Optimistamente la UI marca 4 estrellas rellenas.
5. Se dispara la Server Action `rateVenueAction(venueId, 4)`.
6. Supabase hace UPSERT en `venue_ratings`. La RLS permite porque `auth.uid() = user_id`.
7. La SA llama `revalidatePath('/lugares/{slug}')` para refrescar el promedio en ISR.
8. El componente refleja el estado confirmado.

### Caso — usuario cambia su voto
- Hace clic en otra estrella. El flujo es idéntico (UPSERT ON CONFLICT UPDATE).

### Caso — usuario no autenticado
- Ve estrellas en modo solo-lectura (outline, sin interacción). Un tooltip/texto dice
  "Iniciá sesión para puntuar".

### Edge cases
- Venue inexistente: la SA retorna `{ ok: false, error: 'VENUE_NOT_FOUND' }`.
- Rating fuera de rango (< 1 o > 5): la SA rechaza con `{ ok: false, error: 'INVALID_RATING' }` (validación Zod).
- Error de DB: la SA retorna `{ ok: false, error: string }` con el mensaje de Supabase.

## 7. Contratos de módulo afectados

### `supabase/migrations/0009_venue_ratings.sql`
```sql
CREATE TABLE public.venue_ratings (
  user_id    uuid NOT NULL REFERENCES auth.users  (id) ON DELETE CASCADE,
  venue_id   uuid NOT NULL REFERENCES public.venues (id) ON DELETE CASCADE,
  rating     smallint NOT NULL CHECK (rating BETWEEN 1 AND 5),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, venue_id)
);

ALTER TABLE public.venue_ratings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "venue_ratings_own_select"
  ON public.venue_ratings FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "venue_ratings_own_upsert"
  ON public.venue_ratings FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "venue_ratings_own_update"
  ON public.venue_ratings FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "venue_ratings_own_delete"
  ON public.venue_ratings FOR DELETE USING (auth.uid() = user_id);

-- Vista pública: promedio + conteo agregados, sin exponer user_id.
CREATE VIEW public.venue_rating_stats AS
  SELECT
    venue_id,
    ROUND(AVG(rating)::numeric, 1) AS average_rating,
    COUNT(*)                        AS rating_count
  FROM public.venue_ratings
  GROUP BY venue_id;
```

### `@haku/shared` — `shared/src/types/database.ts`
- Agregar `venue_ratings` a `Database.public.Tables` (Row/Insert/Update/Relationships).
- Agregar `venue_rating_stats` a `Database.public.Views` (Row/Relationships).

### Web (sin ports nuevos en `@haku/core`)
Toda la lógica de ratings vive en `web/` (igual que favoritos), sin cruzar dominios:

- `web/app/(site)/lugares/[slug]/actions.ts` — ampliar con `rateVenueAction(venueId: string, rating: number): Promise<RateResult>`.
- `web/app/(site)/lugares/[slug]/rating-picker.tsx` — componente client con 5 estrellas, estado optimista, `useTransition`.
- `web/app/(site)/lugares/[slug]/page.tsx` — mostrar `<RatingStats>` (promedio + conteo, SSR) y `<RatingPicker>` (client, carga el voto propio vía GET).
- `web/app/api/venues/[slug]/my-rating/route.ts` — GET `force-dynamic`, retorna `{ rating: number | null }` para el usuario actual.
- `web/app/admin/lugares/[slug]/page.tsx` — agregar stat card "Rating" con promedio y conteo.

## 8. Criterios de aceptación
- AC1 — Un usuario autenticado puede votar 1–5 en un venue; la UI refleja su voto.
- AC2 — El mismo usuario puede cambiar su voto; el UPSERT actualiza el registro existente.
- AC3 — El promedio y conteo se muestran en la página pública del venue.
- AC4 — Un usuario anon ve el promedio pero no puede votar (estrellas deshabilitadas).
- AC5 — Rating fuera de rango (0, 6, etc.) es rechazado por la SA con error.
- AC6 — RLS: un usuario no puede leer ni modificar ratings ajenos.
- AC7 — El panel admin muestra promedio + conteo en la página de detalle del venue.
- AC8 — `pnpm -r typecheck` pasa sin errores.
- AC9 — `pnpm -r test` pasa sin errores.

## 9. Riesgos y supuestos
- **Vista pública `venue_rating_stats`**: al ser una VIEW (no tabla), la RLS de la tabla
  subyacente aplica al consultar via Supabase. La vista agrega sin exponer `user_id`; se
  asume que el anon key puede leer la vista (RLS de la view debe permitirlo o la view se
  consulta solo desde server con service_role para el promedio público).
  **Mitigación**: consultar la view con el cliente anon pero con una política `SELECT` que
  permita a todos leer la view (datos ya son agregados, no personales). Alternativamente,
  calcular el promedio con un RPC SECURITY DEFINER para evitar gotchas de RLS en views.
- **Supuesto**: un venue puede tener 0 ratings; en ese caso la view no retorna fila para
  ese `venue_id`, lo que se maneja con `.maybeSingle()` y default `{ average: null, count: 0 }`.

## 10. Preguntas abiertas
_(ninguna — el alcance está bien definido)_
