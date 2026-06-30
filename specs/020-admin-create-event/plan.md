# Plan -- Admin Create Event

## 1. Arquitectura afectada
- `@haku/events` -- nuevo use-case `createEvent` + export en index.ts.
- `@haku/web` -- nuevas rutas `/admin/eventos/nuevo` (page, action, form).
- `@haku/shared` -- sin cambios.
- `@haku/core`, `@haku/auth` -- sin cambios.
- Frontera respetada: web importa de `@haku/events` (API publica). El use-case
  solo depende del port `EventRepository`.
- Sin dependencias npm nuevas.

## 2. Modelo de datos
- Sin migraciones. Tabla `events` ya tiene: id, slug, source_key, external_id,
  title, description, starts_at, ends_at, venue_name, address, location, url,
  image_url, category, status, dedupe_hash, ingested_at.
- RLS: ya configurada. Insert con `service_role` (admin via `createAdminSupabase()`).

## 3. Diseno de ports y use-cases

```ts
// events/src/application/use-cases/create-event.use-case.ts
interface CreateEventInput {
  title: string;
  description?: string;
  startsAt: string;       // ISO datetime
  endsAt?: string;
  venueName?: string;
  address?: string;
  url?: string;
  category?: string;
  status?: EventStatus;   // default "published"
}

function createEvent(
  repo: EventRepository,
  input: CreateEventInput
): Promise<Result<Event>>
  // 1. Validar title no vacio, startsAt es ISO valido
  // 2. Construir RawEvent con sourceKey="manual"
  // 3. normalize(rawEvent) para generar slug + dedupeHash
  // 4. Override status a input.status ?? "published"
  // 5. repo.upsertMany([normalized])
  // 6. Retornar el evento insertado (construido desde normalized + generated id)
```

EventRepository sin cambios -- `upsertMany` ya retorna `{ inserted, updated }`.
Nota: upsertMany no retorna el evento completo. El use-case retorna un
`Result<{ inserted: number }>` en vez de `Result<Event>`, o hacemos un
`repo.getBySlug(slug)` despues del upsert para retornar el evento completo.
Decision: retornar `Result<{ slug: string }>` (suficiente para redirect).

## 4. Diseno de infraestructura
Sin cambios en el adapter Supabase. `upsertMany` ya maneja un array de 1.

## 5. UI / Server Actions / route handlers

### Rutas
- `/admin/eventos/nuevo` -- `force-dynamic`, `requireProfile("admin")`.

### Server Action: `createEventAction`
- Ubicacion: `web/app/admin/eventos/nuevo/actions.ts`
- Extrae campos de FormData, valida con Zod schema simple.
- Llama `createEvent(repo, input)` del use-case.
- En exito: `revalidatePath("/admin/eventos")`, `revalidatePath("/eventos")`,
  `redirect("/admin/eventos")`.
- En error: retorna `{ error: message }`.
- Auth: `requireProfile("admin")` + `createAdminSupabase()`.

### Formulario: `NewEventForm`
- Client component con `useActionState`.
- Campos: titulo*, descripcion, fecha inicio* (datetime-local), fecha fin
  (datetime-local), lugar, direccion, URL externa, categoria (text input libre),
  estado (select: publicado/borrador/pendiente).
- Pattern: mismo que NewVenueForm (Row helper, error banner, submit disabled).

### Boton en pagina lista
- Agregar link "Nuevo evento" en `/admin/eventos/page.tsx` header.

## 6. Estrategia de tests
- Unit: `create-event.use-case.test.ts` con fake repo.
  - Caso feliz: retorna slug generado.
  - Title vacio: retorna ValidationError.
  - startsAt invalido: retorna ValidationError.
- Manual: smoke test en browser (requiere supabase start + pnpm dev).

## 7. Riesgos del plan
- `upsertMany` con 1 elemento podria tener edge case si dedupe_hash colisiona
  con evento existente. Mitigacion: es upsert, actualiza el existente (OK).

## 8. Orden de implementacion
1. T1: Use-case `createEvent` + test unitario en `@haku/events`.
2. T2: Export en `events/src/index.ts`.
3. T3: Server Action `createEventAction` en web.
4. T4: Client component `NewEventForm` + page RSC.
5. T5: Boton "Nuevo evento" en la pagina lista de admin.
6. T6: typecheck + test gate.
