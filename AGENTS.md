# AGENTS.md

Reglas para agentes automáticos. Complementa [`CLAUDE.md`](./CLAUDE.md).

## Antes de escribir código
- Lee `docs/sdd/PROJECT.md`, `docs/sdd/ARCHITECTURE.md`, la `constitución` y el `SDD.md` del módulo afectado.
- Si el SDD del módulo no está `Approved`, **escríbelo/actualízalo y pídelo aprobar primero** (skill `sdd-modular-dev`).

## Límites duros
- No copies código de los repos de referencia. From scratch.
- No cruces fronteras de módulo (solo `@haku/<modulo>` público).
- No metas Supabase/Next dentro de `domain/` ni `use-cases/`.
- No deshabilites RLS. No expongas `SUPABASE_SERVICE_ROLE_KEY` al cliente.
- No commitees ni hagas push salvo que el usuario lo pida.

## Calidad
- `pnpm typecheck` y `pnpm test` deben pasar antes de dar algo por terminado.
- Validación Zod en toda entrada externa (Server Actions, ingesta, API).
- Tests de `use-cases` con fakes de los ports (sin red).
