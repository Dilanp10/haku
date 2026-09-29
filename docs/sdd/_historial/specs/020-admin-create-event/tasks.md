# Tasks -- Admin Create Event

> Lista accionable derivada de `plan.md`. Cada tarea: pequena, testeable, con un
> "hecho" sin ambiguedad. Marcar `[x]` al completar.

## Convenciones
- `T1`, `T2`, ... -- orden recomendado.
- `[P]` tarea paralelizable.
- `[B]` bloqueante para otras.

## Tareas

- [x] T1 [B] -- Crear use-case `createEvent` en
  `events/src/application/use-cases/create-event.use-case.ts`. Recibe
  `CreateEventInput` (title, startsAt requeridos; description, endsAt, venueName,
  address, url, category, status opcionales). Construye un `RawEvent` con
  `sourceKey: "manual"`, llama `normalize()`, override status a
  `input.status ?? "published"`, llama `repo.upsertMany([normalized])`. Retorna
  `Result<{ slug: string }>`. Incluir test unitario con fake repo:
  caso feliz (retorna slug), title vacio (ValidationError), startsAt vacio
  (ValidationError).
  **Hecho cuando**: test pasa con `pnpm -r test`.

- [x] T2 [P] -- Exportar `createEvent` y `CreateEventInput` desde
  `events/src/index.ts`.
  **Hecho cuando**: `pnpm -r typecheck` pasa.

- [x] T3 [B] -- Crear Server Action `createEventAction` en
  `web/app/admin/eventos/nuevo/actions.ts`. Extrae campos de FormData,
  `requireProfile("admin")`, `createAdminSupabase()`, llama al use-case,
  `revalidatePath("/admin/eventos")` + `revalidatePath("/eventos")`,
  `redirect("/admin/eventos")` en exito. Retorna `{ error: string }` en fallo.
  **Hecho cuando**: `pnpm -r typecheck` pasa.

- [x] T4 [B] -- Crear client component `NewEventForm` en
  `web/app/admin/eventos/nuevo/new-event-form.tsx`. Campos: titulo (text, required),
  descripcion (textarea), fecha inicio (datetime-local, required), fecha fin
  (datetime-local), lugar (text), direccion (text), URL (url), categoria (text),
  estado (select: publicado/borrador/pendiente). Usa `useActionState` con
  `createEventAction`. Error banner + submit disabled mientras pending.
  **Hecho cuando**: `pnpm -r typecheck` pasa.

- [x] T5 [P] -- Crear page RSC `web/app/admin/eventos/nuevo/page.tsx` con
  `force-dynamic`, `requireProfile("admin")`, monta `<NewEventForm />`.
  **Hecho cuando**: `pnpm -r typecheck` pasa.

- [x] T6 [P] -- Agregar link/boton "Nuevo evento" en
  `web/app/admin/eventos/page.tsx` apuntando a `/admin/eventos/nuevo`.
  **Hecho cuando**: el boton aparece en la pagina de lista de eventos admin.

- [x] T7 -- Gate final: `pnpm -r typecheck` + `pnpm -r test` pasan.
  **Hecho cuando**: 0 errores en ambos comandos.

## Verificacion final (definition of done)
- [x] `pnpm -r typecheck` pasa.
- [x] `pnpm -r test` pasa (todos los tests existentes + nuevo test de createEvent).
- [x] AC1-AC6 del spec verificados.
- [x] Sin migraciones nuevas.
