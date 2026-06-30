---
name: speckit-tasks
description: Descompone `plan.md` en `tasks.md` accionable. Cada tarea es pequeña, testeable y con "hecho" sin ambigüedad. Úsalo después de `speckit-plan`, antes de `speckit-implement`.
---

# speckit-tasks

## Qué hace
1. Lee `plan.md` (§8 "Orden de implementación").
2. Genera `tasks.md` con tareas numeradas. Convenciones:
   - `[P]` paralelizable, `[B]` bloqueante.
   - Cada tarea cabe en <30 min y produce un cambio observable.
3. Termina con la sección **definition of done** del template.

## Tamaño correcto
- ✅ "T3 — Implementar `getVenueBySlug.use-case.ts` con test del happy path."
- ❌ "T3 — Implementar el módulo de venues." (demasiado grande)
- ❌ "T3 — Importar zod." (demasiado pequeño)

## Reglas
- No mezclar refactors no pedidos en las tareas. Si surge limpieza, registrarla
  aparte en `BACKLOG.md`.
- No marcar `[x]` automático. Solo el agente que ejecuta cierra cada tarea.
