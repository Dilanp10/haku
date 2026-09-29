# CLAUDE.md — Guía para agentes en el repo Haku

Documento operativo para cualquier agente (Claude Code u otro) que trabaje aquí.
La fuente de verdad de la arquitectura es [`docs/sdd/ARCHITECTURE.md`](./docs/sdd/ARCHITECTURE.md) y la
[`constitución`](./.specify/memory/constitution.md). Léelos antes de tocar código.

## Qué es Haku
App de **descubrimiento hiperlocal de Catamarca** (gastronomía/lugares + eventos).
Next.js 15 (App Router) + Supabase (RLS estricta) + Tailwind/shadcn + Leaflet.
Monolito modular de cortes verticales, metodología SDD.

## Mapa del repo
- `shared/` `@haku/shared` — base común (Zod, tipos, Result, errores, constantes).
- `core/`   `@haku/core`   — descubrimiento (venues, categorías, food types, geo).
- `auth/`   `@haku/auth`   — sesión Supabase, perfiles, roles.
- `events/` `@haku/events` — ingesta/scraping de eventos (aislado de core).
- `web/`    `@haku/web`    — Next.js, composition root (única capa que conoce a todos).
- `supabase/` — migraciones SQL + seed + políticas RLS.
- `deploy/`, `Dockerfile`, `docker-compose.yml`, `skaffold.yaml` — contenedores/Cloud Code.
- Cada módulo tiene su diseño en `docs/sdd/M0X-<modulo>/SDD.md`; el estado está en `docs/sdd/PROJECT.md`.

## Reglas que NO se rompen
1. **SDD primero.** Leé `docs/sdd/PROJECT.md`; no implementes nada sin el `SDD.md` del módulo en `Status: Approved`. Metodología: skill `sdd-modular-dev`.
2. **Frontera modular.** Importa solo `@haku/<modulo>` (API pública). Nunca `.../src/...`.
3. **Entre dominios no hay imports directos.** core/auth/events colaboran en `web` o vía `shared`.
4. **Dominio puro.** Nada de Supabase/Next dentro de `domain/` o `use-cases/`. IO por ports.
5. **RLS siempre.** `service_role` solo en servidor. Toda tabla con políticas.
6. **Events aislado.** Sin FK a core; ingesta fuera del request.

## Comandos
```bash
pnpm install            # instalar workspace
pnpm dev                # levantar web (Next.js)
pnpm typecheck          # tipos en todos los paquetes
pnpm test               # vitest en todos los paquetes
supabase start          # stack local de Supabase (Docker)
pnpm db:reset           # aplicar migraciones + seed
```

## Flujo de trabajo (skill `sdd-modular-dev`)
1. Leer `docs/sdd/PROJECT.md` y elegir el módulo (M01–M06) o proponer uno nuevo.
2. Escribir/actualizar `docs/sdd/M0X-*/SDD.md` (Draft) y esperar la aprobación explícita.
3. Crear las tasks en `TASKS.md` (chicas, cada una ligada a un `FR-`/`NFR-`).
4. Implementar por task: ports → use-cases con tests (fakes) → adapters Supabase → `index.ts` → conexión en `web` + migración con RLS.
5. Actualizar el estado de la task y de `PROJECT.md`; cerrar el módulo solo con criterios de aceptación cumplidos.

`docs/sdd/_historial/` (spec-kit anterior) es solo lectura. Las skills `speckit-*` y `.specify/scripts` se eliminaron: no hay otra metodología vigente.
