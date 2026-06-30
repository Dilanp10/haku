# Plan — Admin Venue Detail Preview

> **Cómo** lo construimos. Escrito después de aprobar `spec.md`.

## 1. Arquitectura afectada
- **`@haku/web`** — únicos cambios, todos en `web/app/admin/lugares/`.
  - `web/app/admin/lugares/[slug]/page.tsx` — nuevo RSC.
  - `web/app/admin/lugares/page.tsx` — agrega link "Ver detalle" en cada fila.
  - `web/app/admin/lugares/actions.ts` — agrega `revalidatePath("/admin/lugares/[slug]")` en `quickStatusAction`.

Frontera respetada: se reutilizan `getVenueBySlug`, `listFoodTypes`,
`createSupabaseCoreRepository` de `@haku/core` (API pública). `QuickStatusBtn`
y `quickStatusAction` se reutilizan sin duplicar.

Sin nuevas dependencias npm. Sin migraciones.

**RLS verificada** (migración `0002_core_discovery.sql`): la política
`venues_admin_all` aplica `FOR ALL USING (is_admin())`, por lo que el admin
autenticado puede leer venues en cualquier status con `createServerSupabase()`.
No se necesita `createAdminSupabase()`.

## 2. Modelo de datos
Sin cambios. Sin migraciones.

## 3. Diseño de ports y use-cases
Sin ports ni use-cases nuevos. Se usan los existentes:
```ts
getVenueBySlug(repo, { slug })   // devuelve Venue | null
listFoodTypes(repo)               // devuelve FoodType[]
```

## 4. Diseño de infraestructura
La página nueva usa `createServerSupabase()` (sesión del admin autenticado),
igual que todas las demás páginas de `/admin/`. La RLS garantiza acceso completo.

## 5. UI / Server Actions / route handlers (`web`)

### Nueva ruta: `web/app/admin/lugares/[slug]/page.tsx`
- `export const dynamic = "force-dynamic"` — sin ISR.
- `await requireProfile("admin")` — guard de autorización.
- Carga en paralelo: `getVenueBySlug` + `listFoodTypes`.
- Si el venue no existe: `notFound()`.
- **Barra de acciones admin** (arriba del fold, fondo diferenciado):
  ```
  [← Lugares]   [badge status]   [Editar]   [QuickStatusBtn]   [Ver página pública?]
  ```
  - "← Lugares" → `/admin/lugares`.
  - Badge de status con los mismos colores de `admin/lugares/page.tsx`.
  - "Editar" → `/admin/lugares/[slug]/editar`.
  - `<QuickStatusBtn id={venue.id} slug={venue.slug} status={venue.status} />` —
    importado desde `../quick-status-btn` (ruta relativa dentro de admin).
  - "Ver página pública" (Link externo, `target="_blank"`) → `/lugares/[slug]`,
    solo visible si `venue.status === 'published'`.
- **Contenido principal**: mismo layout que la página pública existente
  (`(site)/lugares/[slug]/page.tsx`): cover image, header, descripción, food types,
  mapa, sidebar con precio y contacto. Se reutiliza la estructura; no se extrae
  componente compartido (el layout público puede evolucionar independientemente).

### Cambio en `web/app/admin/lugares/page.tsx`
En cada fila `<li>`, agregar junto a los botones existentes:
```tsx
<Link href={`/admin/lugares/${v.slug}`} className="...">
  Ver detalle
</Link>
```

### Cambio en `web/app/admin/lugares/actions.ts`
`quickStatusAction` ya revalida `/admin/lugares` y `/lugares/[slug]`. Agregar:
```ts
revalidatePath(`/admin/lugares/${slug}`);
```
para que el preview del admin también se actualice al cambiar el status.

## 6. Estrategia de tests
Sin tests nuevos — es UI pura que reutiliza use-cases ya testeados.
Verificación manual según AC1–AC8 del spec.
`pnpm -r typecheck` + `pnpm -r test` en verde es la barra mínima.

## 7. Riesgos del plan
- **Conflicto de ruta con `/admin/lugares/[slug]/editar`**: Next.js resuelve
  `/admin/lugares/[slug]` como segmento dinámico y `/admin/lugares/[slug]/editar`
  como sub-ruta del mismo. No hay conflicto porque `editar` es una ruta más
  específica y Next.js la prioriza. Verificar que el folder `[slug]/` ya existe
  por la feature de edición.
- **`QuickStatusBtn` importado con ruta relativa**: el import `"../quick-status-btn"`
  desde `[slug]/page.tsx` sube un nivel a `admin/lugares/`. Es un import interno
  dentro de `web/` (no cruza frontera modular).

## 8. Orden de implementación
```
1. Actualizar quickStatusAction — agregar revalidatePath del preview admin.
2. Crear web/app/admin/lugares/[slug]/page.tsx (RSC con barra de acciones + contenido).
3. Agregar link "Ver detalle" en web/app/admin/lugares/page.tsx.
```

Los tres pasos son secuenciales por legibilidad, pero 1 y 3 pueden hacerse en
paralelo con 2 sin riesgo de conflicto.
