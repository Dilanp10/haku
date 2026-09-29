# Feature Spec — Venue Opening Hours

> Documento de **qué** se construye y **por qué**. No describe cómo (eso va en
> `plan.md`). Léelo como contrato: cualquier ambigüedad acá se decide antes de planear.

## 1. Resumen
Los admins cargan los horarios de apertura y cierre por día de la semana para cada
venue. La página pública muestra una tabla compacta de horarios y un badge dinámico
"Abierto ahora" / "Cerrado" calculado en el cliente con la hora local del usuario.

## 2. Motivación
El descubrimiento hiperlocal pierde valor si el usuario no sabe si el lugar está
abierto en este momento. Los horarios son la señal más práctica antes de salir a
visitar un venue.

## 3. Objetivos (en alcance)
- O1 — Tabla `venue_hours` con filas por día (0=domingo … 6=sábado), hora de apertura
  y cierre, y flag `closed` para días que no abren.
- O2 — Form de edición de horarios en `/admin/lugares/[slug]/editar` (fieldset nuevo
  debajo de los datos existentes).
- O3 — Componente público `<OpeningHours>` en la página de detalle del venue: tabla
  compacta + badge "Abierto ahora" / "Cerrado" / "Cierra a las HH:MM" calculado en
  el cliente.
- O4 — Si un venue no tiene ninguna fila en `venue_hours`, no se muestra ningún widget
  (silencioso, no "sin datos").

## 4. No-objetivos (fuera de alcance, declarados)
- N1 — Múltiples turnos por día (ej. mediodía + noche).
- N2 — Horarios especiales por fecha (feriados, temporadas).
- N3 — Timezone por venue (se usa la hora local del browser del visitante).
- N4 — Horarios en la card del listado de venues.
- N5 — Horarios de eventos.

## 5. Usuarios y permisos
| Rol      | Lo que puede hacer                                                        |
|----------|---------------------------------------------------------------------------|
| visitor  | Ver los horarios y el badge "Abierto / Cerrado" en la página del venue.   |
| editor   | Sin acceso al panel admin, no puede editar horarios.                      |
| admin    | Crear, editar y borrar las filas de horarios en el form de edición.       |

## 6. Comportamiento esperado

### Caso feliz — admin carga horarios
1. El admin entra a `/admin/lugares/{slug}/editar`.
2. Al final del form aparece un fieldset "Horarios de atención" con 7 filas (Dom–Sáb).
3. Cada fila tiene: checkbox "Cerrado ese día", input hora apertura, input hora cierre.
4. Al guardar el form, la Server Action hace DELETE + INSERT de todas las filas del venue
   (reemplazo completo, más simple que diff fila por fila).
5. Redirecciona al detalle admin como ya lo hace `updateVenueAction`.

### Caso feliz — visitante ve horarios
1. La página `/lugares/{slug}` renderiza un `<OpeningHours>` server-side con las filas.
2. En el cliente, el componente calcula si el venue está abierto ahora (día + hora local).
3. Muestra badge verde "Abierto · Cierra a las 22:00" o rojo "Cerrado · Abre el lunes a las 09:00".
4. Debajo del badge muestra la tabla de horarios completa por día.

### Edge cases
- Venue sin filas en `venue_hours` → no se renderiza el componente (ni badge ni tabla).
- Día marcado como "Cerrado" → muestra "Cerrado" para ese día en la tabla.
- `closes_at < opens_at` (turno que cruza la medianoche) — **fuera de alcance** (N1).
  El form valida que `closes_at > opens_at` y rechaza si no.

## 7. Contratos de módulo afectados

### `supabase/migrations/0010_venue_hours.sql`
```sql
CREATE TABLE public.venue_hours (
  id         uuid        NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  venue_id   uuid        NOT NULL REFERENCES public.venues (id) ON DELETE CASCADE,
  day_of_week smallint   NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
  opens_at   time        NOT NULL,
  closes_at  time        NOT NULL,
  closed     boolean     NOT NULL DEFAULT false,
  UNIQUE (venue_id, day_of_week)
);

ALTER TABLE public.venue_hours ENABLE ROW LEVEL SECURITY;

-- Lectura pública (visitantes ven los horarios).
CREATE POLICY "venue_hours_public_select"
  ON public.venue_hours FOR SELECT
  USING (true);

-- Solo admins pueden escribir (via service_role en Server Action).
-- No hay política INSERT/UPDATE/DELETE para anon/authenticated:
-- la Server Action usa el cliente admin (service_role).
```

### `@haku/shared` — `shared/src/types/database.ts`
Agregar `venue_hours` a `Database.public.Tables`:
```ts
venue_hours: {
  Row: { id: string; venue_id: string; day_of_week: number; opens_at: string; closes_at: string; closed: boolean };
  Insert: { id?: string; venue_id: string; day_of_week: number; opens_at: string; closes_at: string; closed?: boolean };
  Update: { ... };
  Relationships: [{ foreignKeyName: "venue_hours_venue_id_fkey"; ... }];
};
```

### Web (sin ports nuevos en `@haku/core`)
- `web/app/admin/lugares/[slug]/editar/actions.ts` — ampliar `updateVenueAction` para
  aceptar y persistir los horarios (DELETE + INSERT via `createAdminSupabase()`).
- `web/app/admin/lugares/[slug]/editar/hours-field.tsx` — fieldset client con 7 filas.
- `web/app/(site)/lugares/[slug]/opening-hours.tsx` — componente **client** que recibe
  las filas como props (SSR) y calcula el estado abierto/cerrado en browser.
- `web/app/(site)/lugares/[slug]/page.tsx` — agregar query de horarios + `<OpeningHours>`.

## 8. Criterios de aceptación
- AC1 — Admin puede cargar y guardar horarios de 7 días desde el form de edición.
- AC2 — Venue sin horarios cargados: no aparece ningún widget en la página pública.
- AC3 — Venue con horarios: se muestra la tabla compacta y el badge.
- AC4 — Badge calcula correctamente "Abierto" / "Cerrado" según la hora local del browser.
- AC5 — Día marcado como "Cerrado" aparece como tal en la tabla.
- AC6 — Form valida que `closes_at > opens_at`; si no, muestra error de validación.
- AC7 — `pnpm -r typecheck` pasa sin errores.
- AC8 — `pnpm -r test` pasa sin errores.

## 9. Riesgos y supuestos
- **service_role para escritura**: la SA de edición ya usa `createAdminSupabase()` para
  el upload de imágenes; se reutiliza el mismo patrón para DELETE + INSERT de horarios.
- **Formato `time` de Postgres**: Supabase devuelve `"09:00:00"` (string HH:MM:SS).
  El cliente lo parsea con `new Date("1970-01-01T" + time)` para comparar.
- **Supuesto**: un venue tiene como máximo una fila por día (garantizado por UNIQUE constraint).

## 10. Preguntas abiertas
_(ninguna — el alcance está bien definido)_
