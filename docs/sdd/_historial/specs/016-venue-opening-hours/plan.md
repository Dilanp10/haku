# Plan — Venue Opening Hours

> **Cómo** lo construimos. Se escribe DESPUÉS de aprobar `spec.md`. Si algo del
> spec sigue sin definir, volver al spec y cerrar la pregunta antes de planear.

## 1. Arquitectura afectada
- **`@haku/shared`** — `shared/src/types/database.ts`: nueva entrada `venue_hours` en Tables.
- **`supabase/`** — migración `0010_venue_hours.sql`.
- **`web/`** — form admin ampliado, componente público, página de detalle pública.
- No se toca `@haku/core`, `@haku/auth`, `@haku/events`.

Frontera respetada: la escritura de horarios va directo via `createAdminSupabase()`
en la SA (mismo patrón que cover image upload). La lectura pública va via
`createServerSupabase()` con la policy SELECT abierta.

Sin dependencias npm nuevas.

## 2. Modelo de datos

### `supabase/migrations/0010_venue_hours.sql`
```sql
CREATE TABLE public.venue_hours (
  id          uuid     NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  venue_id    uuid     NOT NULL REFERENCES public.venues (id) ON DELETE CASCADE,
  day_of_week smallint NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
  opens_at    time     NOT NULL,
  closes_at   time     NOT NULL,
  closed      boolean  NOT NULL DEFAULT false,
  UNIQUE (venue_id, day_of_week)
);

ALTER TABLE public.venue_hours ENABLE ROW LEVEL SECURITY;

-- Lectura pública: visitantes pueden ver los horarios.
CREATE POLICY "venue_hours_public_select"
  ON public.venue_hours FOR SELECT USING (true);
-- Escritura: solo via service_role (Server Action admin).
-- No hay políticas INSERT/UPDATE/DELETE para anon/authenticated.
```

### `shared/src/types/database.ts`
```ts
venue_hours: {
  Row: {
    id: string; venue_id: string; day_of_week: number;
    opens_at: string; closes_at: string; closed: boolean;
  };
  Insert: {
    id?: string; venue_id: string; day_of_week: number;
    opens_at: string; closes_at: string; closed?: boolean;
  };
  Update: { opens_at?: string; closes_at?: string; closed?: boolean };
  Relationships: [
    { foreignKeyName: "venue_hours_venue_id_fkey"; columns: ["venue_id"];
      isOneToOne: false; referencedRelation: "venues"; referencedColumns: ["id"] }
  ];
};
```

## 3. Diseño de ports y use-cases
No se crean ports ni use-cases nuevos. Toda la lógica vive en `web/`.

### SA de persistencia (ampliación de `updateVenueAction`)
La SA existente se amplía: después de llamar `updateVenue(repo, id, data)`, lee
las filas de horarios del FormData y ejecuta un reemplazo completo:

```ts
// pseudo-código dentro de updateVenueAction
const adminClient = await createAdminSupabase();
await adminClient.from("venue_hours").delete().eq("venue_id", id);
if (hoursRows.length > 0) {
  await adminClient.from("venue_hours").insert(hoursRows);
}
```

Donde `hoursRows` se construye parseando los campos del FormData con el patrón
`hours[0][opens_at]`, `hours[0][closes_at]`, `hours[0][closed]`, `hours[0][day]`.

### Lógica de "abierto ahora" (cliente puro, sin estado en servidor)
```ts
function isOpenNow(hours: HourRow[]): OpenStatus {
  const now = new Date();
  const day = now.getDay();      // 0=dom … 6=sáb
  const todayRow = hours.find(h => h.day_of_week === day);
  if (!todayRow || todayRow.closed) return { open: false, nextOpen: findNextOpen(hours, day) };
  const opens = parseTime(todayRow.opens_at);
  const closes = parseTime(todayRow.closes_at);
  const nowMins = now.getHours() * 60 + now.getMinutes();
  if (nowMins >= opens && nowMins < closes) return { open: true, closesAt: todayRow.closes_at };
  return { open: false, nextOpen: findNextOpen(hours, day) };
}
function parseTime(t: string): number {  // "09:00:00" → 540 minutos
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
}
```

## 4. Diseño de infraestructura

### Lectura de horarios (RSC, ISR)
En `web/app/(site)/lugares/[slug]/page.tsx` se agrega una query tras resolver el venue:
```ts
const { data: hours } = await supabase
  .from("venue_hours")
  .select("day_of_week, opens_at, closes_at, closed")
  .eq("venue_id", venue.id)
  .order("day_of_week");
```
Las filas se pasan como prop a `<OpeningHours hours={hours ?? []} />`.
Si `hours` es vacío, el componente retorna `null` (O4 del spec).

### Lectura de horarios en el form admin
En `web/app/admin/lugares/[slug]/editar/page.tsx` se agrega la misma query para
pre-poblar el fieldset con los valores actuales.

### Escritura vía SA (reemplazo completo)
`updateVenueAction` ya usa `createAdminSupabase()` para el storage. Se reutiliza
para DELETE + INSERT de `venue_hours`. El FormData codifica los horarios como:
- `hours[0][day]` = `"0"` (número de día)
- `hours[0][opens_at]` = `"09:00"`
- `hours[0][closes_at]` = `"22:00"`
- `hours[0][closed]` = `"on"` | ausente

## 5. UI / Server Actions / route handlers (`web`)

### Nuevos archivos
| Archivo | Tipo | Notas |
|---|---|---|
| `supabase/migrations/0010_venue_hours.sql` | SQL | — |
| `web/app/admin/lugares/[slug]/editar/hours-field.tsx` | Client component | Fieldset 7 filas |
| `web/app/(site)/lugares/[slug]/opening-hours.tsx` | Client component | Badge + tabla |

### Archivos modificados
| Archivo | Cambio |
|---|---|
| `shared/src/types/database.ts` | + `venue_hours` en Tables |
| `web/app/admin/lugares/[slug]/editar/actions.ts` | + persistencia de horarios |
| `web/app/admin/lugares/[slug]/editar/edit-venue-form.tsx` | + `<HoursField>` al final |
| `web/app/admin/lugares/[slug]/editar/page.tsx` | + query de horarios para pre-poblar |
| `web/app/(site)/lugares/[slug]/page.tsx` | + query de horarios + `<OpeningHours>` |

### `HoursField` — fieldset admin (client)
- 7 filas fijas (Dom → Sáb), siempre visibles.
- Props: `initialHours: HourRow[]` (puede ser vacío).
- Cada fila: checkbox "Cerrado", time input apertura, time input cierre.
- Si "Cerrado" está marcado → los inputs de hora se deshabilitan visualmente.
- Validación client-side: `closes_at > opens_at` antes de submit (HTML5 o JS simple).
- Los campos se nombran `hours[N][day]`, `hours[N][opens_at]`, etc.

### `OpeningHours` — componente público (client)
- Props: `hours: HourRow[]` (ya filtradas del servidor).
- Si `hours.length === 0` → `return null`.
- `useEffect` / estado inicializado en mount para evitar hydration mismatch con `new Date()`.
- Badge: verde "Abierto · Cierra a las 22:00" / rojo "Cerrado · Abre el lunes 09:00".
- Tabla: 7 filas (o solo las filas presentes), columnas Día / Horario.
- Días en español: ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"].

### Autorización
- `updateVenueAction` ya llama `requireProfile("admin")` al inicio.
- Lectura de horarios: policy SELECT abierta en `venue_hours`.

## 6. Estrategia de tests
No hay use-cases nuevos. Los tests existentes no se tocan.
`pnpm -r typecheck` + `pnpm -r test` son los gates de cierre.

## 7. Riesgos del plan

| Riesgo | Mitigación |
|---|---|
| Hydration mismatch en `<OpeningHours>` al usar `new Date()` en render | Inicializar el estado en `useEffect`; renderizar "..." hasta que el cliente monte |
| DELETE + INSERT en la SA puede dejar inconsistencia si el INSERT falla | Aceptable para MVP: el admin puede reintentar. Una transacción real requeriría RPC. |
| FormData con estructura `hours[N][key]` puede ser frágil de parsear | Usar índices fijos 0–6 (siempre 7 filas en el form, aunque "Cerrado" esté marcado) |

## 8. Orden de implementación

```
T1 [B] supabase/migrations/0010_venue_hours.sql
T2 [B] shared/src/types/database.ts — venue_hours en Tables
   ↓
T3 [P] web/app/admin/lugares/[slug]/editar/hours-field.tsx
T4 [P] web/app/(site)/lugares/[slug]/opening-hours.tsx
   ↓
T5 [B] web/app/admin/lugares/[slug]/editar/actions.ts — persistencia horarios
T6 [B] web/app/admin/lugares/[slug]/editar/page.tsx — query pre-poblar + HoursField
T7 [B] web/app/admin/lugares/[slug]/editar/edit-venue-form.tsx — montar HoursField
T8 [B] web/app/(site)/lugares/[slug]/page.tsx — query horarios + OpeningHours
```
