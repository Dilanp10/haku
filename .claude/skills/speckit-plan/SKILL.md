---
name: speckit-plan
description: Escribe `plan.md` a partir de un `spec.md` aprobado y sin `?` pendientes. Define ARQUITECTURA y secuencia, no tareas atómicas. Úsalo después de `speckit-specify` (y `speckit-clarify` si hubo huecos), antes de `speckit-tasks`.
---

# speckit-plan

## Pre-requisitos duros
- `spec.md` existe y NO tiene líneas con `?`.
- Acceptance criteria (§8) explícitos y verificables.

## Qué hace
1. Lee `spec.md` y la constitución.
2. Rellena cada sección de `plan.md` (template `.specify/templates/plan-template.md`):
   - **Arquitectura**: módulos afectados, fronteras respetadas.
   - **Datos**: migración SQL nueva (archivo + RLS por tabla).
   - **Ports/use-cases**: pseudo-firmas. Verificar que no se cruzan dominios.
   - **Infra**: cómo se implementan los ports (Supabase, fetch).
   - **Web**: rutas + estrategia (ISR/dinámica) + Server Actions + autorización.
   - **Tests**: unit (use-cases con fakes), opcional integración.
   - **Riesgos**: explicar lo que puede romperse y cómo se mitiga.
   - **Orden**: árbol de dependencias para `tasks.md`.
3. Si el plan revela que el spec era ambiguo: volver a `speckit-clarify`, no improvisar.

## Reglas
- Cero código ejecutable. Pseudo-código permitido en §3.
- No agregar dependencias npm sin justificar en §1.
- Si el plan necesita cambiar la constitución → ADR aparte primero.
