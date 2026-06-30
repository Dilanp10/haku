# Feature Spec — Venue View Count Analytics

> Documento de **qué** se construye y **por qué**. No describe cómo (eso va en
> `plan.md`). Léelo como contrato: cualquier ambigüedad acá se decide antes de planear.

## 1. Resumen
Agregar un contador de visitas por venue. Cada vez que un usuario carga la página
pública `/lugares/[slug]`, un componente cliente mínimo dispara `POST /api/venues/[slug]/view`
que incrementa `view_count` en la tabla `venues` mediante una función RPC de Supabase
con `SECURITY DEFINER`. El contador es visible en el detalle admin y en la lista admin.

## 2. Motivación
Hoy no hay datos sobre qué venues generan más interés. Con un contador simple el
admin puede priorizar qué borradores publicar primero, qué fuentes valen la pena
activar, y qué venues necesitan más contenido. Es la métrica más valiosa con el
menor costo de implementación.

## 3. Objetivos (en alcance)
- O1 — Columna `view_count bigint not null default 0` en la tabla `venues`.
- O2 — Función RPC `increment_venue_views(venue_slug text)` en Supabase con
  `SECURITY DEFINER` (puede actualizar sin bypasear RLS manualmente; solo aplica
  al venue `published` con ese slug).
- O3 — Route handler `POST /api/venues/[slug]/view` (sin autenticación; rate
  limiting natural por ser una llamada por visita de página).
- O4 — Componente cliente `<ViewCounter slug={slug} />` en la página pública
  `/lugares/[slug]` que dispara el POST al montar. No bloquea el render, no
  muestra nada al usuario.
- O5 — `view_count` visible en la página de detalle admin `/admin/lugares/[slug]`
  como stat ("N visitas").
- O6 — `view_count` visible en la lista admin `/admin/lugares` como columna
  numérica junto al nombre.
- O7 — `Venue` del dominio incluye `viewCount: number`.
- O8 — `CoreRepository` expone `incrementViewCount(slug: string): Promise<void>`.

## 4. No-objetivos (fuera de alcance, declarados)
- N1 — No contar visitas únicas (solo totales; sin cookies ni fingerprinting).
- N2 — No contar visitas a eventos (solo venues en esta iteración).
- N3 — No mostrar el contador al público (solo admin lo ve).
- N4 — No implementar rate limiting explícito en el endpoint (el costo de un
  contador extra es mínimo; bots masivos son un problema futuro).
- N5 — No persistir historial de visitas por día/hora (solo el total acumulado).
- N6 — No resetear el contador al archivar/republicar un venue.

## 5. Usuarios y permisos
| Actor | Acción |
|---|---|
| Cualquier visitante (anon) | Dispara POST /api/venues/[slug]/view implícitamente al cargar la página pública |
| Admin | Ve el contador en el detalle y la lista admin |

La RPC usa `SECURITY DEFINER` y solo incrementa venues `published`, por lo que
un visitante no puede inflar contadores de venues draft ni archived.

## 6. Comportamiento esperado

### Carga de la página pública
1. Next.js sirve `/lugares/[slug]` (posiblemente desde caché ISR).
2. El HTML incluye `<ViewCounter slug={slug} />` (componente cliente).
3. En el browser, al montar, el componente llama `fetch('POST /api/venues/slug/view')`.
4. El route handler llama `repo.incrementViewCount(slug)`.
5. La RPC incrementa `view_count` en la DB. El usuario no ve nada.

### Detalle admin
El campo "Visitas" muestra el `viewCount` del venue cargado (no en tiempo real,
se actualiza al recargar la página admin que es `force-dynamic`).

### Lista admin
Columna "Visitas" con el `view_count` de cada venue, ordenada por el query
existente (no requiere reordenar).

### Venue no published
Si alguien llama directamente `POST /api/venues/[slug]/view` para un venue draft,
la RPC no hace nada (filtra `WHERE status = 'published'`). El endpoint retorna
`200` igual para no revelar información.

## 7. Contratos de módulo afectados

### `@haku/core`
- `core/src/domain/venue.ts` — agregar `viewCount: number` al tipo `Venue`.
- `core/src/application/ports/core-repository.port.ts` — agregar método:
  ```ts
  incrementViewCount(slug: string): Promise<void>;
  ```
- `core/src/infrastructure/supabase-core.repository.ts` — implementar
  `incrementViewCount` llamando a `supabase.rpc('increment_venue_views', { venue_slug: slug })`.
- `core/src/index.ts` — no requiere export nuevo (el método es llamado desde `web/`).

### `@haku/shared`
- Sin cambios.

### `supabase/migrations/`
- `0007_venue_view_count.sql` — nuevo archivo:
  - `ALTER TABLE venues ADD COLUMN view_count bigint not null default 0`.
  - Función `increment_venue_views(venue_slug text)` con `SECURITY DEFINER`.
  - Sin nueva política RLS (la función SECURITY DEFINER la bypasea para ese UPDATE).

### `web/`
- `web/app/(site)/lugares/[slug]/page.tsx` — agregar `<ViewCounter slug={slug} />`.
- `web/components/view-counter.tsx` — nuevo componente cliente mínimo.
- `web/app/api/venues/[slug]/view/route.ts` — nuevo route handler POST.
- `web/app/admin/lugares/[slug]/page.tsx` — mostrar `venue.viewCount` como stat.
- `web/app/admin/lugares/page.tsx` — mostrar `view_count` en cada fila.

## 8. Criterios de aceptación
- AC1 — Cargar `/lugares/[slug]` incrementa `view_count` en 1 (verificable en DB).
- AC2 — El contador aparece en `/admin/lugares/[slug]` con el valor correcto.
- AC3 — El contador aparece en la lista `/admin/lugares` para cada venue.
- AC4 — POST para venue draft/archived no incrementa el contador.
- AC5 — La página pública sigue usando ISR (no se convierte en `force-dynamic`).
- AC6 — `pnpm -r typecheck` pasa sin errores.
- AC7 — `pnpm -r test` pasa sin errores (los fakes de test agregan `incrementViewCount`).

## 9. Riesgos y supuestos
- **ISR**: La página pública es ISR; el `<ViewCounter>` es un componente cliente que
  corre en el browser, por lo que cada visita real incrementa el contador
  independientemente del caché. Este es el diseño correcto.
- **Fakes en tests unitarios**: todos los fakes de `CoreRepository` deben agregar
  `incrementViewCount: async () => {}`. Hay varios archivos de test afectados.
- **`rowToVenue` en el adapter**: debe mapear `view_count → viewCount`. El campo
  tiene default 0, así que nunca será null.
- **`exactOptionalPropertyTypes`**: `viewCount` es required (no opcional) en `Venue`;
  el adapter siempre lo provee desde la DB.

## 10. Preguntas abiertas
Ninguna — el alcance es técnicamente cerrado.
