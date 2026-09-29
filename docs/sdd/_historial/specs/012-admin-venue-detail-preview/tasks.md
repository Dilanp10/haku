# Tasks — Admin Venue Detail Preview

> Lista accionable derivada de `plan.md`. Cada tarea: pequeña, testeable, con un
> "hecho" sin ambigüedad. Marcar `[x]` al completar.

## Convenciones
- `T1`, `T2`, ... — orden recomendado.
- `[P]` tarea paralelizable.
- `[B]` bloqueante para otras.

## Tareas

- [x] T1 [P] — Actualizar `web/app/admin/lugares/actions.ts`: agregar
  `revalidatePath(\`/admin/lugares/\${slug}\`)` en `quickStatusAction`, después de
  las revalidaciones existentes. Hecho cuando typecheck pasa.

- [x] T2 [B] — Crear `web/app/admin/lugares/[slug]/page.tsx` (RSC):
  - `export const dynamic = "force-dynamic"`.
  - `await requireProfile("admin")` al inicio.
  - Carga en paralelo `getVenueBySlug(repo, { slug })` + `listFoodTypes(repo)`.
  - Si venue es null: `notFound()`.
  - **Barra de acciones** (borde inferior, fondo `bg-muted/50`):
    - Link "← Lugares" → `/admin/lugares`.
    - Badge de status (`STATUS_LABEL` / `STATUS_TONE` copiados del listado).
    - Link "Editar" → `/admin/lugares/[slug]/editar`.
    - `<QuickStatusBtn>` importado desde `"../quick-status-btn"`.
    - Link "Ver página pública" (target `_blank`) → `/lugares/[slug]`, solo si `status === 'published'`.
  - **Contenido principal** bajo la barra: cover image, header (nombre + dirección),
    descripción, food types, mapa (`VenueMap`), sidebar precio + contacto.
    Mismo layout que `(site)/lugares/[slug]/page.tsx`.
  - Hecho cuando la página carga en el browser para un venue draft y uno published.

- [x] T3 [P] — Agregar link "Ver detalle" en `web/app/admin/lugares/page.tsx`:
  En el `<div className="flex shrink-0 gap-2">` de cada fila, agregar antes del
  botón "Editar":
  ```tsx
  <Link href={`/admin/lugares/${v.slug}`} className="rounded-md border px-3 py-1.5 text-sm hover:border-primary/40">
    Ver detalle
  </Link>
  ```
  Hecho cuando el link aparece en la lista y navega correctamente.

## Verificación final (definition of done)
- [x] `pnpm -r typecheck` pasa sin errores.
- [x] `pnpm -r test` pasa sin errores.
- [x] AC1 — `/admin/lugares/[slug]` carga para un venue `draft`.
- [x] AC2 — `/admin/lugares/[slug]` carga para un venue `published`.
- [x] AC3 — Slug inexistente → 404.
- [x] AC5 — "Editar" lleva a `/admin/lugares/[slug]/editar`.
- [x] AC7 — "Ver página pública" solo visible si `published`.
- [x] AC8 — Lista `/admin/lugares` muestra "Ver detalle" en cada fila.
- [x] `BACKLOG.md` actualizado con la Fase 24.
