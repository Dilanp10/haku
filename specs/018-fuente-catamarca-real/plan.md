# Plan -- Fuente Catamarca Real (cierre del pipeline de ingesta)

> Como lo construimos. Spec aprobado: `spec.md` sin `?` pendientes.

## 1. Arquitectura afectada

- **`web/` unico modulo modificado** -- tres archivos:
  - `web/lib/events/build-sources.ts` -- helper extraido del route handler (nuevo)
  - `web/app/admin/eventos/actions.ts` -- nueva Server Action `triggerIngestionAction`
  - `web/app/admin/eventos/page.tsx` -- boton “Disparar Ingesta” + banner resultado
- **`@haku/events`** -- sin cambios.
- **`supabase/`** -- sin cambios. `seed.sql` ya tiene `demo-catamarca` con `active=true`.
- Frontera respetada: `web` importa `@haku/events` por API publica unicamente.

## 2. Modelo de datos

Sin cambios de schema. La fila `demo-catamarca` ya esta en `seed.sql`.
La tabla `events` recibe filas via `upsertMany` durante la ingesta (ya implementado).

## 3. Diseno de ports y use-cases

Sin firmas nuevas. Se reutilizan del modulo `@haku/events`:
```ts
runIngestion(deps: { sources: EventSourcePort[]; repo: EventRepository }): Promise<IngestionSummary>
createDemoSource(): EventSourcePort
createSupabaseEventRepository(client): EventRepository
```

Nueva Server Action (pseudo-codigo):
```ts
// web/app/admin/eventos/actions.ts
async function triggerIngestionAction(): Promise<IngestionSummary> {
  await requireProfile(“admin”);
  const adminClient = createAdminSupabase();
  const repo = createSupabaseEventRepository(adminClient);
  const rows = await adminClient.from(“event_sources”).select(“*”).eq(“active”, true);
  const sources = buildSources(rows.data, serverEnv.scraperUserAgent);
  const summary = await runIngestion({ sources, repo });
  await adminClient.from(“event_sources”)
    .update({ last_run_at: new Date().toISOString() })
    .in(“key”, sources.map(s => s.key));
  revalidatePath(“/admin/eventos”);
  revalidatePath(“/eventos”);
  return summary;
}
```

## 4. Diseno de infraestructura

- La Server Action usa `createAdminSupabase()` (service_role) para el upsert --
  igual que el route handler HTTP. La anon key bloquearia los inserts por RLS.
- `buildSources` se extrae a `web/lib/events/build-sources.ts`:
  - `key === 'demo-catamarca'` -> `createDemoSource()`
  - `type === 'html'` -> `createHtmlSource({ ...config, userAgent })`
  - `type === 'ical'` -> `createICalSource({ key, url, userAgent })`
  - `type === 'api'` -> `null` (no implementado, se filtra)
- El route handler `/api/events/ingest/route.ts` se refactoriza para importar
  `buildSources` desde `web/lib/events/build-sources.ts` (elimina duplicacion).

## 5. UI / Server Actions / route handlers (`web`)

### `triggerIngestionAction` (nueva)
- Archivo: `web/app/admin/eventos/actions.ts`
- Auth: `requireProfile(“admin”)`
- Retorna: `IngestionSummary` serializable (no lanza, devuelve errores en el campo `errors`)

### `TriggerIngestionBtn` (nuevo componente cliente)
- Archivo: `web/app/admin/eventos/trigger-ingestion-btn.tsx`
- Usa `useActionState(triggerIngestionAction, null)` para capturar el resultado
- Muestra spinner mientras corre (`useFormStatus`)
- Tras completar: badge verde “N insertados” o banner rojo con los errores
- Se agrega en el `<header>` de `page.tsx` junto a los filtros

### Estrategia de renderizado
- La pagina ya es `force-dynamic`. No cambia.
- `revalidatePath` hace que al recargar el listado muestre los nuevos pending.

## 6. Estrategia de tests

- **Unit**: no hay logica de dominio nueva. `runIngestion` ya tiene tests en `@haku/events`.
- **Smoke manual** (AC1-AC6):
  1. `pnpm db:reset` -> fuente `demo-catamarca` queda activa
  2. `/admin/eventos` -> clic “Disparar Ingesta”
  3. Verificar banner: “6 fetched, 6 inserted, 0 updated”
  4. Ver 6 eventos `pending` en el listado
  5. Publicar uno -> aparece en `/eventos`
  6. Disparar ingesta de nuevo -> “6 fetched, 0 inserted, 6 updated” (sin duplicados)

## 7. Riesgos del plan

- **`buildSources` duplicado**: si no se extrae correctamente, route handler y SA pueden divergir. Mitigacion: T1 es extraer primero, T2 refactoriza el route handler para importarlo.
- **Serializacion de `IngestionSummary`**: Next.js requiere que los valores de retorno de SA sean serializables (plain objects). `IngestionSummary` solo tiene primitivos y arrays de strings -> sin problema.
- **`useActionState` en Next.js 15**: la API esta estabilizada en React 19 / Next 15. Verificar que el proyecto usa la importacion correcta (`react` no `react-dom`).

## 8. Orden de implementacion

```
T1: Extraer buildSources -> web/lib/events/build-sources.ts
    + Actualizar route handler para importarlo (refactor sin cambio de comportamiento)
    |
    +-- T2: Agregar triggerIngestionAction en actions.ts
        (buildSources + runIngestion + adminClient + revalidatePath)
        |
        +-- T3: Agregar TriggerIngestionBtn + wiring en page.tsx
            (useActionState, spinner, banner resultado)
            |
            +-- T4: Smoke test end-to-end
                (db:reset, disparar, moderar, verificar /eventos, sin duplicados)
```

