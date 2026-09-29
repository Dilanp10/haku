# Plan — Venue Ratings

> **Cómo** lo construimos. Se escribe DESPUÉS de aprobar `spec.md`. Si algo del
> spec sigue sin definir, volver al spec y cerrar la pregunta antes de planear.

## 1. Arquitectura afectada
- **`@haku/shared`** — `shared/src/types/database.ts`: nuevas entradas `venue_ratings`
  (Table) y `venue_rating_stats` (View). Ahora `Views` deja de ser vacío.
- **`web/`** — rutas, Server Action, componentes client, route handler. Toda la lógica
  de ratings vive en `web/` igual que favoritos (Feature 026); no hay lógica de negocio
  que justifique un use-case puro en `@haku/core`.
- **`supabase/`** — migración nueva `0009_venue_ratings.sql`.
- No se toca `@haku/core`, `@haku/auth`, `@haku/events`.

Frontera respetada: `web/` accede a Supabase directamente con el cliente tipado
`createServerSupabase()`. La View `venue_rating_stats` se lee desde el mismo cliente
(datos agregados, sin user_id).

Sin dependencias npm nuevas.

## 2. Modelo de datos

### `supabase/migrations/0009_venue_ratings.sql`
```sql
CREATE TABLE public.venue_ratings (
  user_id    uuid     NOT NULL REFERENCES auth.users   (id) ON DELETE CASCADE,
  venue_id   uuid     NOT NULL REFERENCES public.venues (id) ON DELETE CASCADE,
  rating     smallint NOT NULL CHECK (rating BETWEEN 1 AND 5),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, venue_id)
);

ALTER TABLE public.venue_ratings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "venue_ratings_own_select"
  ON public.venue_ratings FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "venue_ratings_own_insert"
  ON public.venue_ratings FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "venue_ratings_own_update"
  ON public.venue_ratings FOR UPDATE USING (auth.uid() = user_id);

-- Vista pública: agrega sin exponer user_id individual.
CREATE VIEW public.venue_rating_stats AS
  SELECT
    venue_id,
    ROUND(AVG(rating)::numeric, 1) AS average_rating,
    COUNT(*)::int                   AS rating_count
  FROM public.venue_ratings
  GROUP BY venue_id;
```

**RLS de la view**: las views en Postgres heredan los permisos de las tablas base según
el `search_path`. Para que el anon key pueda leer la view, se agrega una política SELECT
abierta en la view (o se lee via service_role desde un Server Component). Decisión:
consultar `venue_rating_stats` desde el RSC con el cliente anon pero con una policy
abierta solo en la view para SELECT, ya que los datos son agregados públicos.

```sql
ALTER VIEW public.venue_rating_stats OWNER TO postgres;
GRANT SELECT ON public.venue_rating_stats TO anon, authenticated;
```

### `shared/src/types/database.ts`
```ts
venue_ratings: {
  Row: { user_id: string; venue_id: string; rating: number; created_at: string; updated_at: string };
  Insert: { user_id: string; venue_id: string; rating: number; created_at?: string; updated_at?: string };
  Update: { user_id?: string; venue_id?: string; rating?: number; updated_at?: string };
  Relationships: [
    { foreignKeyName: "venue_ratings_venue_id_fkey"; columns: ["venue_id"]; isOneToOne: false; referencedRelation: "venues"; referencedColumns: ["id"] }
  ];
};
// En Views:
venue_rating_stats: {
  Row: { venue_id: string; average_rating: number | null; rating_count: number };
  Relationships: [];
};
```

También actualizar `Views` para que deje de ser `{[_ in never]: never}` y acepte
`venue_rating_stats`.

## 3. Diseño de ports y use-cases
No se crean ports ni use-cases nuevos en `@haku/core`. La feature es
infraestructura + UI pura en `web/`.

Pseudo-firmas de la Server Action:
```ts
// web/app/(site)/lugares/[slug]/actions.ts (se amplía)
type RateResult = { ok: true; rating: number } | { ok: false; error: string };

async function rateVenueAction(venueId: string, rating: number): Promise<RateResult>
  // 1. Validar rating ∈ [1,5] con Zod
  // 2. createServerSupabase() → getUser() → si no hay sesión, error UNAUTHENTICATED
  // 3. UPSERT en venue_ratings ON CONFLICT (user_id, venue_id) DO UPDATE SET rating, updated_at
  // 4. revalidatePath('/lugares/' + slug) — necesita slug, ver nota abajo
  // 5. return { ok: true, rating }
```
> **Nota de revalidación**: la SA necesita el slug del venue para revalidar la ruta ISR.
> Se pasa como parámetro adicional: `rateVenueAction(venueId, rating, slug)`.

Route handler de solo-lectura:
```ts
// web/app/api/venues/[slug]/my-rating/route.ts
GET → { rating: number | null }
  // getUser() → si anon, { rating: null }
  // select rating FROM venue_ratings WHERE user_id = uid AND venue_id = venueId
  // retorna { rating: data?.rating ?? null }
```

## 4. Diseño de infraestructura

### Lectura del promedio (RSC, ISR)
En `web/app/(site)/lugares/[slug]/page.tsx` (ya ISR con `revalidate = 600`), se añade
una consulta extra al render del Server Component:

```ts
const { data: stats } = await supabase
  .from("venue_rating_stats")
  .select("average_rating, rating_count")
  .eq("venue_id", venue.id)
  .maybeSingle();
```
Resultado se pasa como props a un componente presentacional `<RatingDisplay>`.

### UPSERT del rating
```ts
await supabase
  .from("venue_ratings")
  .upsert(
    { user_id: uid, venue_id: venueId, rating, updated_at: new Date().toISOString() },
    { onConflict: "user_id,venue_id" }
  );
```

### Lectura del voto propio (client-side, same pattern as SaveButton)
El `RatingPicker` (client component) carga su estado inicial vía
`GET /api/venues/[slug]/my-rating` en `useEffect` — preserva ISR en la detail page.

## 5. UI / Server Actions / route handlers (`web`)

### Nuevos archivos
| Archivo | Tipo | Estrategia |
|---|---|---|
| `supabase/migrations/0009_venue_ratings.sql` | SQL | — |
| `web/app/api/venues/[slug]/my-rating/route.ts` | Route handler | force-dynamic |
| `web/app/(site)/lugares/[slug]/rating-picker.tsx` | Client component | — |
| `web/app/(site)/lugares/[slug]/rating-display.tsx` | Server component (presentacional) | — |

### Archivos modificados
| Archivo | Cambio |
|---|---|
| `shared/src/types/database.ts` | venue_ratings table + venue_rating_stats view |
| `web/app/(site)/lugares/[slug]/actions.ts` | + `rateVenueAction` |
| `web/app/(site)/lugares/[slug]/page.tsx` | + stats query + `<RatingDisplay>` + `<RatingPicker>` |
| `web/app/admin/lugares/[slug]/page.tsx` | + stat card "Rating" |

### `RatingPicker` — flujo de estados
```
mounted → fetch /my-rating → myRating: number|null
  null (sin voto): 5 estrellas outline, hover interactivo
  number (con voto): N estrellas rellenas, resto outline
clic estrella K:
  optimistic: setMyRating(K)
  startTransition → rateVenueAction(venueId, K, slug)
  ok: false → revertir + mostrar error
  ok: true → setMyRating(result.rating)
```

Anon (myRating === undefined, no fetch intentado): estrellas estáticas, tooltip "Iniciá sesión para puntuar". La distinción anon vs cargando se resuelve pasando `hasSession: boolean` como prop (desde el RSC padre que ya tiene el perfil).

### `RatingDisplay` — componente presentacional puro
Props: `averageRating: number | null`, `ratingCount: number`.
Render: `⭐ 4.2 (17 votos)` o `Sin puntuaciones aún` si null.

### Autorización
- `rateVenueAction` rechaza si no hay sesión (`UNAUTHENTICATED`).
- La RLS rechaza cualquier intento de escribir con `user_id ≠ auth.uid()`.

## 6. Estrategia de tests
No se crean use-cases nuevos, así que no hay unit tests nuevos de dominio.
Los tests existentes no se rompen (no se tocan fakes).

**Smoke manual** (verificar tras implementar):
- Votar como usuario autenticado → ver promedio actualizado (con `revalidate` o forzando refresh).
- Cambiar voto → promedio se ajusta.
- Anon → estrellas deshabilitadas.

`pnpm -r typecheck` + `pnpm -r test` son los gates automáticos de cierre.

## 7. Riesgos del plan

| Riesgo | Mitigación |
|---|---|
| Views en `Database` type — `Views` dejaba de ser `{[_ in never]: never}` puede romper tipado | Definir la view row correctamente; verificar typecheck tras el cambio |
| `GRANT SELECT` en la view puede no ser suficiente con RLS activado en la tabla base | Si falla, fallback a leer el promedio desde un RSC con el anon client que tenga la RLS SELECT abierta en la VIEW explícitamente (`SECURITY DEFINER` en la view, o policy en `venue_rating_stats`) |
| `revalidatePath` en la SA requiere el slug (no solo el venueId) | Se pasa como tercer parámetro a `rateVenueAction`; el `RatingPicker` ya recibe `slug` como prop |

## 8. Orden de implementación

```
T1 [B] supabase/migrations/0009_venue_ratings.sql
T2 [B] shared/src/types/database.ts — venue_ratings + venue_rating_stats en Views
   ↓
T3 [P] web/app/api/venues/[slug]/my-rating/route.ts
T4 [P] web/app/(site)/lugares/[slug]/actions.ts — añadir rateVenueAction
T5 [P] web/app/(site)/lugares/[slug]/rating-display.tsx
T6 [P] web/app/(site)/lugares/[slug]/rating-picker.tsx
   ↓ (T3, T4, T5, T6 listos)
T7 [B] web/app/(site)/lugares/[slug]/page.tsx — integrar stats query + RatingDisplay + RatingPicker
T8 [P] web/app/admin/lugares/[slug]/page.tsx — stat card Rating
```
