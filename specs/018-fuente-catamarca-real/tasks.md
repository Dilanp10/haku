# Tasks -- Fuente Catamarca Real

> Lista accionable derivada de `plan.md`. Cada tarea: pequena, testeable, con un
> “hecho” sin ambiguedad. Marcar `[x]` al completar.

## Convenciones
- `T1`, `T2`, ... -- orden recomendado.
- `[P]` tarea paralelizable.
- `[B]` bloqueante para otras.

## Tareas

- [x] T1 [B] -- Crear `web/lib/events/build-sources.ts` extrayendo la funcion `buildSources`
  del route handler `web/app/api/events/ingest/route.ts`. La funcion toma las filas de
  `event_sources` y el userAgent, devuelve `EventSourcePort[]`. Actualizar el route
  handler para importarla desde ahi (comportamiento identico, sin duplicacion).
  **Hecho cuando**: el route handler compila y `buildSources` esta en el nuevo archivo.

- [x] T2 [B] -- Agregar `triggerIngestionAction` en `web/app/admin/eventos/actions.ts`.
  Usa `requireProfile(“admin”)`, `createAdminSupabase()`, `buildSources`, `runIngestion`,
  actualiza `last_run_at` y llama `revalidatePath` en `/admin/eventos` y `/eventos`.
  Retorna `IngestionSummary` (plain object serializable).
  **Hecho cuando**: la funcion esta exportada y tipada sin errores de TypeScript.

- [x] T3 [B] -- Crear `web/app/admin/eventos/trigger-ingestion-btn.tsx` (componente
  cliente). Usa `useActionState(triggerIngestionAction, null)` y `useFormStatus` para
  mostrar spinner durante la ejecucion. Tras completar muestra badge verde
  “X insertados, Y actualizados” o listado de errores en rojo. Agregar el componente
  en el `<header>` de `web/app/admin/eventos/page.tsx`.
  **Hecho cuando**: el boton aparece en `/admin/eventos` y muestra el resultado de la
  accion sin recargar la pagina manualmente.

- [ ] T4 [P] -- Smoke test end-to-end manual:
  1. `pnpm db:reset` (seed aplica `demo-catamarca` activa)
  2. Navegar a `/admin/eventos`, clicar “Disparar Ingesta”
  3. Verificar banner: fetched=6, inserted=6
  4. Verificar 6 filas `pending` en el listado
  5. Publicar un evento, verificar que aparece en `/eventos`
  6. Clicar “Disparar Ingesta” de nuevo: inserted=0, updated=6 (sin duplicados)
  **Hecho cuando**: los 6 pasos pasan sin errores.

## Verificacion final (definition of done)
- [x] `pnpm -r typecheck` pasa.
- [x] `pnpm -r test` pasa.
- [ ] AC1-AC6 del spec verificados via smoke test (T4) -- pendiente prueba manual.
- [x] Sin migraciones nuevas (no aplica en esta feature).
- [x] `BACKLOG.md` actualizado si surgieron pendientes.

