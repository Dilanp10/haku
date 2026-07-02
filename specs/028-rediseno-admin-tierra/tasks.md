# Tasks — Rediseño del panel admin (Tierra oscuro)

> Derivado de `plan.md`. Feature nueva. Solo presentación; no tocar lógica ni Server Actions.

## Tareas
- [x] T1 [B] — `admin/layout.tsx`: shell oscuro (`.dark` + `var(--bg)`/`var(--fg)`), header con
  branding terracota, nav, y "Cerrar sesión".
- [x] T2 [B] — `admin/lugares/page.tsx`: lista estilo morficat (Nombre+slug / Categoría emoji /
  Estado pill / Editar) + botones "+ Nuevo lugar" y "Sugerencias (N)".
- [x] T3 [P] — `admin/lugares/sugerencias/page.tsx`: lista de venues `draft` del wizard con sus
  datos y link al detalle admin (reusa flujo 025).
- [x] T4 [P] — `admin/page.tsx`: dashboard en oscuro Tierra (stat/action cards restyle).
- [x] T5 [B] — `new-venue-form.tsx` + `edit-venue-form.tsx`: forms seccionados oscuros
  (BÁSICO, UBICACIÓN, CONTACTO, IMAGEN, TIPOS, ATRIBUTOS, HORARIOS, ESTADO) sin cambiar campos.
- [x] T6 [B] — `admin/lugares/[slug]/page.tsx` + `.../editar/page.tsx` + `nuevo/page.tsx`:
  heredar el estilo (wrappers/headers).
- [x] T7 [B] — `pnpm -r typecheck` + build + deploy + verificación visual vs morficat.

## Verificación final (definition of done)
- [x] AC1 — Admin en oscuro Tierra, título terracota.
- [x] AC2 — Lista replica el layout de morficat.
- [x] AC3 — Botón "Sugerencias" con badge → drafts.
- [x] AC4 — Forms seccionados como morficat.
- [x] AC5 — Guardar/publicar/editar sigue funcionando.
- [x] AC6 — `pnpm -r typecheck` pasa.
