---
name: speckit-implement
description: Ejecuta las tareas de `tasks.md` una por una. Úsalo solo cuando `spec.md`, `plan.md` y `tasks.md` están aprobados. Respeta la frontera modular, escribe tests, y al final verifica `pnpm -r typecheck` + `pnpm -r test`.
---

# speckit-implement

## Pre-requisitos duros
- Existen `spec.md`, `plan.md`, `tasks.md` para la feature actual.
- Ninguna tarea pendiente está marcada como bloqueada por una pregunta abierta.

## Flujo por tarea
1. Marcar la tarea como en progreso (TaskCreate/TaskUpdate).
2. Implementar SOLO esa tarea. Sin agregar features no pedidas.
3. Si toca un módulo, respetar:
   - Dominio puro en `domain/` y `application/use-cases/`.
   - IO solo en `infrastructure/`.
   - Imports entre módulos solo por `@haku/<modulo>` (API pública).
4. Si la tarea agrega un use-case: test unitario con fake del port.
5. Marcar `[x]` en `tasks.md` y registrar la tarea como completada.
6. Pasar a la siguiente.

## Cierre de la feature
- Ejecutar `pnpm -r typecheck` y `pnpm -r test`. Ambos en verde son obligatorios.
- Verificar checklist (`checklists/acceptance.md`) manualmente.
- Actualizar `BACKLOG.md`.

## Reglas duras
- NO commitear ni hacer push salvo que el usuario lo pida explícitamente.
- NO desactivar RLS, NO usar `--no-verify`, NO bypass de hooks.
- Si una tarea revela que el plan era incorrecto: detenerse, registrar en
  `plan.md` el desvío y consultar al usuario.
