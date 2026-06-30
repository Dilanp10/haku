# Tasks — Venue Opening Hours

> Lista accionable derivada de `plan.md`. Cada tarea: pequeña, testeable, con un
> "hecho" sin ambigüedad. Marcar `[x]` al completar.

## Convenciones
- `T1`, `T2`, ... — orden recomendado.
- `[P]` tarea paralelizable.
- `[B]` bloqueante para otras.

## Tareas

### Bloque 1 — Infra (secuencial, bloquea todo lo demás)

- [x] T1 [B] — Crear `supabase/migrations/0010_venue_hours.sql`:
  - Tabla `venue_hours (id uuid PK, venue_id, day_of_week smallint 0–6, opens_at time, closes_at time, closed bool)`.
  - FK a `public.venues` con `ON DELETE CASCADE`.
  - UNIQUE `(venue_id, day_of_week)`.
  - RLS habilitada + policy SELECT abierta (`USING (true)`).
  - Sin políticas INSERT/UPDATE/DELETE (se escribe via service_role).

- [x] T2 [B] — Actualizar `shared/src/types/database.ts`:
  - Agregar `venue_hours` a `Database.public.Tables` con Row/Insert/Update/Relationships.
  - Hecho cuando `pnpm typecheck` pasa en `@haku/shared`.

### Bloque 2 — Componentes (paralelos entre sí, dependen de Bloque 1)

- [x] T3 [P] — Crear `web/app/admin/lugares/[slug]/editar/hours-field.tsx`:
  - `"use client"`.
  - Props: `initialHours: Array<{ day_of_week: number; opens_at: string; closes_at: string; closed: boolean }>`.
  - 7 filas fijas (índices 0–6 = Dom–Sáb), nombres `hours[N][day]`, `hours[N][opens_at]`, `hours[N][closes_at]`, `hours[N][closed]`.
  - Checkbox "Cerrado" por fila: si está marcado, los inputs de hora se deshabilitan.
  - Pre-pobla desde `initialHours`; si no hay fila para un día, defaults vacíos.
  - No hace fetch ni SA propio — solo renderiza campos para el form padre.

- [x] T4 [P] — Crear `web/app/(site)/lugares/[slug]/opening-hours.tsx`:
  - `"use client"`.
  - Props: `hours: Array<{ day_of_week: number; opens_at: string; closes_at: string; closed: boolean }>`.
  - Si `hours.length === 0` → `return null`.
  - Estado `status` inicializado en `useEffect` (evita hydration mismatch): calcula si está abierto usando `new Date()`.
  - Badge: verde "Abierto · Cierra a las HH:MM" / rojo "Cerrado · Abre el [día] a las HH:MM".
  - Tabla: días en español ["Dom","Lun","Mar","Mié","Jue","Vie","Sáb"], columna Horario ("09:00 – 22:00" o "Cerrado").
  - Días sin fila en `hours`: no aparecen en la tabla (venue no especificó horario ese día).

### Bloque 3 — Integración (secuencial)

- [x] T5 [B] — Ampliar `web/app/admin/lugares/[slug]/editar/actions.ts`:
  - Después de `updateVenue(...)`, parsear las 7 filas de horarios del FormData:
    `hours[N][day]`, `hours[N][opens_at]`, `hours[N][closes_at]`, `hours[N][closed]`.
  - Filtrar filas con `opens_at` y `closes_at` no vacíos (filas sin horario se ignoran).
  - Validar `closes_at > opens_at` en cada fila válida; si falla → `return { error: "..." }`.
  - Usar `adminClient.from("venue_hours").delete().eq("venue_id", id)` + `.insert(rows)`.
  - `adminClient` ya disponible en la acción (se importa `createAdminSupabase`).

- [x] T6 [B] — Actualizar `web/app/admin/lugares/[slug]/editar/page.tsx`:
  - Agregar query: `.from("venue_hours").select(...).eq("venue_id", venue.id).order("day_of_week")`.
  - Pasar `hours` como prop al componente de formulario.

- [x] T7 [B] — Actualizar `web/app/admin/lugares/[slug]/editar/edit-venue-form.tsx`:
  - Recibir prop `initialHours` y montarlo al final del form.
  - Importar y renderizar `<HoursField initialHours={initialHours} />` dentro del `<form>`.

- [x] T8 [B] — Actualizar `web/app/(site)/lugares/[slug]/page.tsx`:
  - Agregar query de horarios tras resolver el venue:
    `.from("venue_hours").select("day_of_week, opens_at, closes_at, closed").eq("venue_id", venue.id).order("day_of_week")`.
  - Renderizar `<OpeningHours hours={hours ?? []} />` en el sidebar o debajo del header.

## Verificación final (definition of done)
- [ ] `pnpm -r typecheck` pasa sin errores.
- [ ] `pnpm -r test` pasa sin errores.
- [ ] AC1 — Admin puede guardar horarios desde el form de edición.
- [ ] AC2 — Venue sin horarios: no aparece el widget en la página pública.
- [ ] AC3 — Venue con horarios: se muestra tabla + badge.
- [ ] AC4 — Badge calcula "Abierto/Cerrado" correctamente.
- [ ] AC5 — Día marcado "Cerrado" aparece como tal en la tabla.
- [ ] AC6 — Form valida `closes_at > opens_at`.
- [ ] `BACKLOG.md` actualizado con Fase 28.
