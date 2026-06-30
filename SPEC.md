# SPEC Maestro — Haku

> Documento-contrato de la arquitectura. Define **qué** es Haku y **cómo interactúan
> sus módulos**. No describe la implementación interna de cada módulo (eso vive en
> `<modulo>/spec/SPEC.md`). Es la fuente de verdad de las fronteras del sistema.
>
> Metodología: **Spec-Driven Development (SDD)**. Ningún módulo se implementa antes
> de que su `SPEC.md` esté aprobado. Ver `.specify/memory/constitution.md`.

## 1. Visión

**Haku** ("Haku", *vamos* en quechua) es una app de **descubrimiento hiperlocal de
Catamarca**: ayuda a la gente a decidir *a dónde ir* — lugares y gastronomía (módulo
**Core**) y qué está pasando — **eventos** locales (módulo **Events**), con mapa,
categorías y geolocalización.

- **Síntesis de referencias** (solo como modelo, código construido *from scratch*):
  - Patrón / disciplina SDD y separación modular ← `tuamigofiel`.
  - Lógica de negocio de descubrimiento y stack técnico ← `Morficat`.

## 2. Stack técnico (decisión fija)

| Capa            | Tecnología                                            |
|-----------------|-------------------------------------------------------|
| Framework       | Next.js 15 (App Router, RSC, Server Actions, ISR)     |
| Lenguaje        | TypeScript (strict)                                   |
| Datos / Auth    | Supabase (Postgres + Auth + Storage) con **RLS estricta** |
| UI              | Tailwind CSS + shadcn/ui + Lucide                     |
| Mapas           | Leaflet + OpenStreetMap                               |
| Monorepo        | pnpm workspaces                                       |
| Contenedores    | Docker + Skaffold (Cloud Code / Kubernetes)           |
| Tests           | Vitest                                                |

## 3. Arquitectura: monolito modular de cortes verticales

Cada **dominio es una carpeta independiente en la raíz** y un paquete del workspace.
Cada módulo es autocontenido (dominio + aplicación + infraestructura) y expone una
**única API pública** a través de su `src/index.ts`.

```
haku/
├── shared/    @haku/shared   — schemas (Zod), tipos, constantes, Result/errores. Sin deps de otros módulos.
├── core/      @haku/core     — descubrimiento: venues, categorías, food types, búsqueda geográfica.
├── auth/      @haku/auth     — identidad: sesión Supabase, perfiles, roles.
├── events/    @haku/events   — ingesta/scraping de eventos de Catamarca (aislado, desacoplado de core).
└── web/       @haku/web      — Next.js App Router. Composition root: la ÚNICA capa que conoce a todos.
```

### 3.1 Regla de dependencias (invariante de arquitectura)

```
web  ──> core ──┐
 │   ──> auth ──┼──> shared
 │   ──> events ┘
core, auth, events  ──> shared        (permitido)
core  ─X─> auth, events               (PROHIBIDO entre dominios)
auth  ─X─> core, events               (PROHIBIDO)
events ─X─> core, auth                (PROHIBIDO)
cualquiera ─X─> web                   (PROHIBIDO: web es el tope)
```

- Un módulo **solo** importa la API pública (`@haku/<modulo>`) de otro. Nunca rutas
  internas (`@haku/core/src/infrastructure/...` está prohibido).
- Entre dominios (core/auth/events) **no** hay dependencias directas. Si necesitan
  colaborar, lo hacen en `web` (composition root) o vía `shared`.
- `shared` no depende de nadie.

### 3.2 Patrón interno de cada módulo de dominio (hexagonal-lite)

```
<modulo>/
├── spec/SPEC.md                 # contrato del módulo (SDD: se escribe PRIMERO)
└── src/
    ├── domain/                  # entidades + lógica pura (sin IO, sin Supabase)
    ├── application/
    │   ├── ports/               # interfaces (p.ej. VenueRepository) que la infra implementa
    │   └── use-cases/           # orquestan dominio + ports. Reciben deps por inyección.
    ├── infrastructure/          # adapters Supabase que implementan los ports
    └── index.ts                 # API PÚBLICA: use-cases, tipos, factory de infra
```

## 4. Contratos entre módulos

Los módulos se comunican por **interfaces TypeScript exportadas** desde su `index.ts`.
El detalle de cada contrato vive en `<modulo>/spec/SPEC.md`; aquí solo la frontera.

### 4.1 `@haku/shared` (base común)
Expone: `Result<T,E>` y helpers, jerarquía de errores de dominio, esquemas Zod
compartidos (paginación, geo), tipos generados de la base de datos (`Database`),
constantes (rangos de precio, configuración de mapa).

### 4.2 `@haku/core` (descubrimiento)
Expone casos de uso puros de orquestación (no Server Actions):
`listVenues`, `getVenueBySlug`, `searchVenuesNearby`, `listCategories`, `listFoodTypes`.
Recibe un `CoreRepository` (port) creado por `createSupabaseCoreRepository(client)`.
**No** expone tablas ni el cliente Supabase directamente.

### 4.3 `@haku/auth` (identidad)
Expone: `getCurrentUser`, `getProfile`, `requireRole`, tipo `Role`.
Provee el contrato de sesión que `web` usa para proteger rutas. **No** conoce venues
ni eventos; otros módulos reciben el `userId`/`role` ya resuelto desde `web`.

### 4.4 `@haku/events` (ingesta de eventos) — módulo nuevo, aislado
Expone DOS caras claramente separadas:
- **Lectura** (consumida por `web`): `listUpcomingEvents`, `getEventBySlug`.
- **Ingesta** (consumida por un job/cron, nunca por la UI directa):
  `runIngestion(sourceKey?)`, que usa `EventSourcePort` (scrapers) + `EventRepository`.

El **aislamiento** es un requisito duro: Events tiene sus propias tablas (`event_*`),
**sin FK a las tablas de core**. Si una salida de eventos falla, descubrimiento
(core) sigue operativo, y viceversa. Ver `events/spec/SPEC.md`.

## 5. Modelo de datos (alto nivel; detalle en cada SPEC de módulo)

| Módulo | Tablas (esquema `public`)                                  | RLS |
|--------|------------------------------------------------------------|-----|
| auth   | `profiles`                                                 | sí  |
| core   | `categories`, `food_types`, `venues`, `venue_food_types`   | sí  |
| events | `event_sources`, `events`                                  | sí  |

Política RLS general: **lectura pública** solo de filas `status = 'published'`;
escritura restringida a `service_role` (jobs) o a perfiles con rol `admin`. Detalle
por tabla en las migraciones de `supabase/migrations/` y en cada SPEC.

## 6. Flujos clave (cómo cooperan los módulos)

### 6.1 Explorar lugares (lectura pública, ISR)
```
Usuario → web (RSC, revalidate=ISR) → @haku/core.listVenues(repo) → Supabase (RLS lectura pública)
```

### 6.2 Publicar/editar un lugar (mutación, Server Action)
```
Usuario admin → web (Server Action) → @haku/auth.requireRole('admin')
                                     → @haku/core.<useCase>(repo, input)  → Supabase → revalidatePath()
```

### 6.3 Ingesta de eventos (job aislado)
```
Cron / POST /api/events/ingest (token) → @haku/events.runIngestion()
   → EventSourcePort[].fetch()  (scraping cortés)
   → normalizar + deduplicar (dedupe_hash)
   → EventRepository.upsert()   (service_role)  → Supabase events (status='pending')
Un admin luego publica los eventos (status='published') para que web los muestre vía ISR.
```

## 7. Jerarquía de specs (dos niveles)

Haku separa **contrato del módulo** (durable) de **especificación de feature**
(efímero, por entrega). Inspirado en Spec-Kit (`tuamigofiel`).

### 7.1 SPECs de módulo (arquitectura)
`<modulo>/spec/SPEC.md` describe qué expone un módulo a perpetuidad: responsabilidad,
modelo de dominio, ports, RLS, no-objetivos. Cambian raramente.
- [`shared/spec/SPEC.md`](shared/spec/SPEC.md)
- [`core/spec/SPEC.md`](core/spec/SPEC.md)
- [`auth/spec/SPEC.md`](auth/spec/SPEC.md)
- [`events/spec/SPEC.md`](events/spec/SPEC.md)

### 7.2 SPECs de feature (entregables, SDD)
`specs/NNN-<slug>/` contiene los artefactos del ciclo de una feature concreta:
`spec.md` → `plan.md` → `tasks.md` → `checklists/acceptance.md` + opcional
`contracts/`, `quickstart.md`. Se generan con:
```bash
.specify/scripts/bash/create-new-feature.sh "Nombre de la feature"
# o en Windows:
pwsh .specify/scripts/powershell/create-new-feature.ps1 "Nombre"
```
Estado actual:
- [`001-project-bootstrap/`](specs/001-project-bootstrap/spec.md) ✅
- [`002-auth-login-logout/`](specs/002-auth-login-logout/spec.md) ✅
- [`003-venue-discovery/`](specs/003-venue-discovery/spec.md) ✅
- [`004-events-ingestion/`](specs/004-events-ingestion/spec.md) ⏳ (planeado)

### 7.3 Workflow
1. `speckit-specify` → escribe `spec.md`.
2. `speckit-clarify` → resuelve cada `?` del spec con el usuario.
3. `speckit-plan` → escribe `plan.md`.
4. `speckit-tasks` → escribe `tasks.md`.
5. `speckit-implement` → ejecuta tarea por tarea hasta verde.

Las skills viven en `.claude/skills/speckit-*/SKILL.md`.

Ver `BACKLOG.md` para el detalle priorizado.
