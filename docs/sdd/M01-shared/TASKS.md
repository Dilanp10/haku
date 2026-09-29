# Tasks — M01: shared

Fuente: SDD.md (Approved)

## TASK-001 — Scaffolding del monorepo y paquete shared
Status: COMPLETED
Satisfies: FR-001, FR-002, FR-003, FR-005, NFR-001, NFR-002

Descripción:
Monorepo pnpm, tsconfig base y paquete `@haku/shared` con Result, errores, esquemas y constantes.

Completed:
- Backfill de la feature 001 (Fase 0 y 1): Result/errores, esquemas Zod y constantes.

Files:
- shared/src/**

Tests:
- Ver historial: `_historial/specs/001-project-bootstrap/`

SDD requirements satisfied:
- FR-001, FR-002, FR-003, FR-005

## TASK-002 — Tipos `Database` al día con las migraciones
Status: COMPLETED
Satisfies: FR-004

Descripción:
Mantener `shared/src/types/database.ts` sincronizado (venues.attributes/neighborhood, view_count, venue_saves, ratings, hours, push).

Completed:
- Actualizado en las features 013–016, 021 y 023 (backfill).

Files:
- shared/src/types/database.ts

Tests:
- `pnpm typecheck` en el workspace.

SDD requirements satisfied:
- FR-004
