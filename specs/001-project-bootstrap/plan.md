# Plan — Project Bootstrap

## 1. Arquitectura afectada
Toda la fundación: monorepo, módulos, Supabase, contenedores. Define el patrón que
respetan las demás features (frontera modular, dominio puro, RLS).

## 2. Modelo de datos
- `0001_auth_profiles.sql`: `profiles` + enum `user_role` + trigger `handle_new_user`
  + helper `is_admin()`.
- `0002_core_discovery.sql`: `categories`, `food_types`, `venues`, `venue_food_types`.
- `0003_events.sql`: `event_sources`, `events` (sin FK a core).
- RLS estricta en todas las tablas (lectura pública limitada a `published`).

## 3. Ports y use-cases
Stubs en cada módulo (ver `<modulo>/spec/SPEC.md`).

## 4. Infraestructura
- `@supabase/ssr` para clientes server/client/admin en `web/lib/supabase/*`.
- Adapters stub que lanzan `Error("no implementado")` hasta la fase respectiva.

## 5. UI / Server Actions / route handlers
- Landing pública (`/`), ISR.
- `/api/health` para Kubernetes probes.
- `/api/events/ingest` (POST, token-gated) — composition root del módulo events.

## 6. Tests
- Vitest por módulo. Tests de use-cases con fakes de ports (cero IO).

## 7. Riesgos
- supabase-js v2.47 expandió generics → resuelto con `HakuSupabaseClient` laxo.
- pnpm monorepo + Next 15 `transpilePackages` para no precompilar TS.

## 8. Orden
1. Workspace + tsconfig base.
2. SPEC maestro + constitución + docs.
3. `shared`.
4. Stubs de `core`, `auth`, `events` + sus `spec/SPEC.md`.
5. `web` base.
6. Migraciones + seed.
7. Contenedores (Dockerfile, compose, Skaffold, k8s).
