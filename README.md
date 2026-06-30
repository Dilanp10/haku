# Haku

> **Haku** (*vamos*, en quechua). Descubrimiento hiperlocal de **Catamarca**:
> gastronomía y lugares (módulo Core) + eventos locales (módulo Events), con mapa,
> categorías y geolocalización.

Construido **from scratch** sintetizando dos referencias:
- **Arquitectura modular + disciplina SDD** ← [`tuamigofiel`](https://github.com/Maximaube19/tuamigofiel)
- **Lógica de negocio + stack** ← [`Morficat`](https://github.com/Dilanp10/Morficat)

## Stack
Next.js 15 (App Router) · TypeScript strict · Supabase (Postgres + Auth + Storage, RLS estricta) · Tailwind + shadcn/ui · Leaflet/OpenStreetMap · pnpm workspaces · Docker + Skaffold.

## Arquitectura (monolito modular de cortes verticales)
Cada dominio es una carpeta en la raíz y un paquete `@haku/*`, autocontenido, que expone
solo su `index.ts`. Detalle en [`SPEC.md`](./SPEC.md).

| Paquete | Carpeta | Responsabilidad |
|---|---|---|
| `@haku/shared` | [`shared/`](./shared) | Zod, tipos, Result, errores, constantes |
| `@haku/core` | [`core/`](./core) | Descubrimiento: venues, categorías, food types, geo |
| `@haku/auth` | [`auth/`](./auth) | Sesión Supabase, perfiles, roles |
| `@haku/events` | [`events/`](./events) | Ingesta/scraping de eventos (aislado) |
| `@haku/web` | [`web/`](./web) | Next.js App Router — composition root |

Cada módulo tiene su contrato en `<modulo>/spec/SPEC.md`.

## Requisitos
| Herramienta | Versión |
|---|---|
| Node.js | 22 LTS |
| pnpm | 9.x |
| Docker | 24+ (Compose v2) |
| Supabase CLI | última |

## Arranque
```bash
pnpm install
cp .env.example .env.local            # completar claves de Supabase
supabase start                        # stack local (Postgres/Auth/Storage) en Docker
pnpm db:reset                         # migraciones + seed
pnpm dev                              # http://localhost:3000
```

## Desarrollo guiado por specs (SDD, Spec-Kit)
Dos niveles de spec:
- **Módulo** (durable): `<modulo>/spec/SPEC.md` — contrato de arquitectura.
- **Feature** (efímero): `specs/NNN-<slug>/{spec,plan,tasks}.md` + `checklists/`.

Para una feature nueva:
```bash
.specify/scripts/bash/create-new-feature.sh "Nombre"
# o (Windows): pwsh .specify/scripts/powershell/create-new-feature.ps1 "Nombre"
```
Luego, ciclo Spec-Kit con las skills `.claude/skills/speckit-*`:
**specify → clarify → plan → tasks → implement**.
Reglas completas en [`CLAUDE.md`](./CLAUDE.md) y la
[constitución](./.specify/memory/constitution.md).

## Contenedores / Cloud Code
- Desarrollo: `docker compose up`
- Kubernetes / Cloud Code: `skaffold dev` (manifiestos en [`deploy/k8s`](./deploy/k8s)).

## Estado
Fase 0 — **Fundación SDD completa**: monorepo, specs maestro y por módulo, scaffolding
base, Supabase (migraciones + RLS + seed) y contenedores. Sin lógica de negocio aún
(specs primero). Ver [`BACKLOG.md`](./BACKLOG.md).
