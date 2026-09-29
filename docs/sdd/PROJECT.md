# Estado del proyecto — Haku

> Fuente única de verdad del proyecto (skill `sdd-modular-dev`). Leer SIEMPRE antes de
> trabajar. Migrado el 2026-09-29 desde spec-kit, que se eliminó del repo. Sus
> `specs/` y `BACKLOG.md` están en [`_historial/`](./_historial/), solo lectura.

## Arquitectura

Monolito modular de cortes verticales (pnpm workspaces): `shared` ← `core` / `auth` /
`events` ← `web` (composition root). Detalle vinculante en
[ARCHITECTURE.md](./ARCHITECTURE.md). Constitución (principios no negociables) en
[`.specify/memory/constitution.md`](../../.specify/memory/constitution.md).

## Módulos

- [M01 — shared](./M01-shared/SDD.md): COMPLETED
- [M02 — auth](./M02-auth/SDD.md): COMPLETED
- [M03 — core (lugares)](./M03-core/SDD.md): IN_PROGRESS (TASK-014, 015 y 017 pendientes)
- [M04 — events](./M04-events/SDD.md): IN_PROGRESS (TASK-008 a 011 pendientes)
- [M05 — web (PWA y UI)](./M05-web/SDD.md): IN_PROGRESS (solo quedan TASK-010 y 011, opcionales)
- [M06 — infra (deploy y Supabase)](./M06-infra/SDD.md): IN_PROGRESS (TASK-005: verificar despliegue real)

Los 6 SDD fueron aprobados el 2026-09-29. Los `TASKS.md` de esta migración son un
**backfill** del historial de las 31 features; las tasks nuevas se crean con el SDD aprobado.

## Mapa feature (spec-kit) → módulo

| Módulo | Features históricas (`_historial/specs/`) |
|---|---|
| M01 shared | 001 |
| M02 auth | 002, 027 |
| M03 core | 003, 005, 006, 012, 013, 014, 015, 016, 017, 023, 024, 025, 026 |
| M04 events | 004, 008, 009, 010, 011, 018, 020 |
| M05 web | 007, 021, 022, 028, 029, 030, 031 |
| M06 infra | 019 (+ Docker, Skaffold, migraciones, CI) |

Features transversales: 010 (tests de integración) toca M03 y M04; 021 (push) toca M04 y
M05; 001 toca todos. Se asignaron al módulo que más las usa.

## Dependencias entre módulos

```
M05 web ──> M03 core, M02 auth, M04 events ──> M01 shared
M06 infra: transversal (migraciones RLS de todos, CI, deploy)
```

## Proceso desde ahora

1. Idea nueva → relevamiento → módulo existente o nuevo `M0X`.
2. `SDD.md` (Draft) → aprobación explícita → `TASKS.md` → implementación → tests → cierre.
3. Cambios sobre un SDD aprobado: actualizar SDD (vuelve a Draft) → re-aprobación → tasks.
4. `specs/`, `BACKLOG.md` y los `SPEC.md` de módulo ya no se editan.
