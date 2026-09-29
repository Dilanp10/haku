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
solo su `index.ts`. Detalle en [`docs/sdd/ARCHITECTURE.md`](./docs/sdd/ARCHITECTURE.md).

| Paquete | Carpeta | Responsabilidad |
|---|---|---|
| `@haku/shared` | [`shared/`](./shared) | Zod, tipos, Result, errores, constantes |
| `@haku/core` | [`core/`](./core) | Descubrimiento: venues, categorías, food types, geo |
| `@haku/auth` | [`auth/`](./auth) | Sesión Supabase, perfiles, roles |
| `@haku/events` | [`events/`](./events) | Ingesta/scraping de eventos (aislado) |
| `@haku/web` | [`web/`](./web) | Next.js App Router — composition root |

Cada módulo tiene su diseño en `docs/sdd/M0X-<modulo>/SDD.md`.

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

## Desarrollo guiado por SDD (skill `sdd-modular-dev`)
Todo el diseño y el estado viven en [`docs/sdd/`](./docs/sdd/PROJECT.md):
- **Módulo**: `docs/sdd/M0X-<nombre>/SDD.md` (diseño) y `TASKS.md` (tasks verificables).
- **Estado**: [`docs/sdd/PROJECT.md`](./docs/sdd/PROJECT.md).
- **Historial** (spec-kit anterior, solo lectura): `docs/sdd/_historial/`.

Ciclo por módulo: SDD (Draft) → aprobación → tasks → implementación → tests → cierre.
Reglas completas en [`CLAUDE.md`](./CLAUDE.md) y la
[constitución](./.specify/memory/constitution.md).

## Contenedores / Cloud Code
- Desarrollo: `docker compose up`
- Kubernetes / Cloud Code: `skaffold dev` (manifiestos en [`deploy/k8s`](./deploy/k8s)).

## Estado
App en producción con 6 módulos documentados (M01–M06). Estado y tasks pendientes en
[`docs/sdd/PROJECT.md`](./docs/sdd/PROJECT.md).
