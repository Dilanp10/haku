# CLAUDE.md — Guía para agentes en el repo Haku

Documento operativo para cualquier agente (Claude Code u otro) que trabaje aquí.
La fuente de verdad de la arquitectura es [`SPEC.md`](./SPEC.md) y la
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
- Cada módulo tiene su contrato en `<modulo>/spec/SPEC.md`.

## Reglas que NO se rompen
1. **Specs primero.** No implementes un módulo sin su `SPEC.md` aprobado.
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

## Flujo de trabajo para un módulo nuevo o feature
1. Escribir/actualizar `<modulo>/spec/SPEC.md` (contrato, modelo de datos, ports, RLS).
2. Definir los `ports` (interfaces) en `application/ports/`.
3. Escribir los `use-cases` puros con tests (vitest) usando fakes de los ports.
4. Implementar los adapters Supabase en `infrastructure/`.
5. Exponer la API pública en `index.ts`.
6. Conectar en `web` (RSC/Server Action/route handler) + migración Supabase con RLS.
