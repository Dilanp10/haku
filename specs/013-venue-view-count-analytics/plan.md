# Plan — Venue View Count Analytics

> **Cómo** lo construimos. Escrito después de aprobar `spec.md`.

## 1. Arquitectura afectada
- **`@haku/shared`** — `database.ts`: agregar `view_count` al Row/Insert/Update de `venues`.
- **`@haku/core`** — dominio, port, adapter, tests unitarios (fakes).
- **`supabase/migrations/`** — nuevo archivo `0007_venue_view_count.sql`.
- **`@haku/web`** — nuevo componente, nuevo route handler, páginas admin y pública.

Sin dependencias npm nuevas.

Frontera respetada: `incrementViewCount` vive en `CoreRepository` (port de `@haku/core`).
La llamada desde `web/` va por la API pública del paquete. El componente cliente
(`ViewCounter`) vive en `web/components/` y no importa nada de dominios.

## 2. Modelo de datos

### `supabase/migrations/0007_venue_view_count.sql`
```sql
-- Columna de conteo de visitas.
ALTER TABLE public.venues
  ADD COLUMN view_count bigint NOT NULL DEFAULT 0;

-- RPC con SECURITY DEFINER: puede hacer UPDATE aunque la RLS prohíba UPDATE anon.
-- Solo incrementa venues publicados, evitando inflación de drafts/archived.
CREATE OR REPLACE FUNCTION public.increment_venue_views(venue_slug text)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  UPDATE public.venues
  SET view_count = view_count + 1
  WHERE slug = venue_slug AND status = 'published';
$$;
```

No se necesita nueva política RLS: la función SECURITY DEFINER corre como su
owner (postgres) y no está sujeta a las políticas de la sesión del llamador.

### `shared/src/types/database.ts`
Agregar `view_count: number` al `Row` de `venues` (en `Insert` es opcional con
default 0; en `Update` ya está cubierto por el `Partial`).

## 3. Diseño de ports y use-cases

```ts
// core/src/application/ports/core-repository.port.ts — método nuevo:
interface CoreRepository {
  // ...existentes...
  incrementViewCount(slug: string): Promise<void>;
}
```

No se agrega use-case nuevo — `incrementViewCount` es una operación de
infraestructura pura (sin lógica de negocio que testear). Se llama directamente
desde el route handler de `web/`.

### Cambios en domain
```ts
// core/src/domain/venue.ts — campo nuevo en Venue:
interface Venue {
  // ...existentes...
  viewCount: number;   // requerido, nunca null (default 0 en DB)
}
```

### Fakes en tests unitarios
Todos los `fakeRepo` de los 4 archivos de test de `@haku/core` deben agregar:
```ts
incrementViewCount: async () => {},
```
Sin esto el typecheck falla porque `CoreRepository` tiene el método nuevo.

## 4. Diseño de infraestructura

### Adapter (`supabase-core.repository.ts`)
```ts
async incrementViewCount(slug: string): Promise<void> {
  await client.rpc('increment_venue_views', { venue_slug: slug });
  // Errores se ignoran silenciosamente — el conteo no es crítico.
},
```

### `rowToVenue` (mapeo fila → dominio)
Agregar: `viewCount: row.view_count ?? 0`.

## 5. UI / Server Actions / route handlers (`web`)

### Nuevo: `web/app/api/venues/[slug]/view/route.ts`
```ts
export async function POST(req, { params }) {
  const { slug } = await params;
  const supabase = createAdminSupabase(); // service_role para llamar la RPC
  const repo = createSupabaseCoreRepository(supabase);
  await repo.incrementViewCount(slug);   // silencioso si falla
  return new Response(null, { status: 204 });
}
```
Sin autenticación — cualquiera puede llamarlo (eso es intencional; el guard
real está en la RPC que filtra por `status = 'published'`).

### Nuevo: `web/components/view-counter.tsx`
```tsx
"use client";
import { useEffect } from "react";

export function ViewCounter({ slug }: { slug: string }) {
  useEffect(() => {
    fetch(`/api/venues/${slug}/view`, { method: "POST" });
  }, [slug]);
  return null;
}
```
No renderiza nada. No bloquea. Fallo silencioso (no hay `.catch` explícito;
el browser lo maneja).

### Cambio: `web/app/(site)/lugares/[slug]/page.tsx`
Agregar al final del JSX (dentro de `<main>`):
```tsx
<ViewCounter slug={slug} />
```
La página sigue siendo ISR (`revalidate = 600`). El componente cliente corre
en el browser en cada visita real.

### Cambio: `web/app/admin/lugares/[slug]/page.tsx`
En la barra de acciones admin o en la sidebar, agregar:
```tsx
<InfoCard label="Visitas">
  <span className="text-2xl font-bold">{venue.viewCount.toLocaleString('es-AR')}</span>
</InfoCard>
```

### Cambio: `web/app/admin/lugares/page.tsx`
En cada fila `<li>`, junto al slug, agregar:
```tsx
<span className="text-xs text-muted-foreground">{v.viewCount} visitas</span>
```

## 6. Estrategia de tests
- No se agrega use-case nuevo → no hay test unitario nuevo.
- Los 4 fakes de `@haku/core` se actualizan para satisfacer el tipo `CoreRepository`.
- `pnpm -r typecheck` + `pnpm -r test` en verde confirman la correctitud.
- AC1 se verifica manualmente con Supabase local.

## 7. Riesgos del plan
- **`touch_updated_at` trigger**: el trigger de `updated_at` se dispara al
  incrementar `view_count` porque es un UPDATE. Esto contamina `updated_at` con
  cada visita. Mitigación: la migración agrega la columna con `DEFAULT 0` y la
  función RPC puede excluir `updated_at` — pero el trigger es unconditional.
  Solución: modificar el trigger para que solo actualice `updated_at` si cambian
  columnas distintas a `view_count`. Alternativa más simple: aceptarlo (las
  páginas usan ISR con revalidación de 10 min, no `updated_at` para ordenar
  visitas). Se elige **aceptar el comportamiento** para no complicar la migración;
  se documenta como trade-off conocido.
- **`database.ts` manual**: los tipos de DB son manuales. Hay que agregar
  `view_count` al `Row` de `venues` para que el adapter tipee correctamente.

## 8. Orden de implementación
```
1. supabase/migrations/0007_venue_view_count.sql
2. shared/src/types/database.ts  — agregar view_count al Row de venues
3. core/src/domain/venue.ts      — agregar viewCount: number a Venue
4. core/src/application/ports/core-repository.port.ts — agregar incrementViewCount
5. core/src/infrastructure/supabase-core.repository.ts — implementar + rowToVenue
6. Actualizar fakes en los 4 test files de @haku/core
7. web/app/api/venues/[slug]/view/route.ts (nuevo)
8. web/components/view-counter.tsx (nuevo)
9. web/app/(site)/lugares/[slug]/page.tsx — agregar <ViewCounter>
10. web/app/admin/lugares/[slug]/page.tsx — mostrar viewCount
11. web/app/admin/lugares/page.tsx — mostrar viewCount en lista
```

Pasos 1–6 son de `@haku/core` y `@haku/shared` (deben ir primero).
Pasos 7–11 dependen de 1–6 y son independientes entre sí.
