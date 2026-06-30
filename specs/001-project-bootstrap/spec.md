# Feature Spec — Project Bootstrap

> Estado: **completado** (Fase 0).

## 1. Resumen
Levantar la fundación SDD de Haku: monorepo pnpm con cortes verticales por dominio,
SPEC maestro, constitución, scaffolding de módulos, Supabase con RLS, contenedores.

## 2. Motivación
Ningún módulo se puede implementar sin la fundación. La constitución (specs primero,
frontera modular, RLS) tiene que existir antes de cualquier feature de producto.

## 3. Objetivos
- O1 — Monorepo pnpm con paquetes `@haku/{shared,core,auth,events,web}`.
- O2 — Cada dominio tiene `<modulo>/spec/SPEC.md` (contrato de arquitectura del módulo).
- O3 — Supabase configurado con migraciones base + RLS estricta + seed.
- O4 — Docker + Skaffold + manifiestos k8s funcionando.
- O5 — `pnpm -r typecheck` y `pnpm -r test` pasan.

## 4. No-objetivos
- N1 — Lógica de negocio (eso son las siguientes features).
- N2 — UI completa de descubrimiento.
- N3 — Ingesta de eventos real.

## 5. Usuarios y permisos
N/A — esto es infra. Define el modelo de roles que usan otras features.

## 6. Comportamiento esperado
- `pnpm install` resuelve los workspaces.
- `pnpm dev` levanta Next.js en `:3000`.
- `supabase start` + `pnpm db:reset` aplica migraciones y seed.
- `/api/health` responde 200.

## 7. Contratos de módulo
- `shared`: tipos `Database`, `Result`, errores, Zod base, constantes.
- Resto de módulos: `spec/SPEC.md` + scaffolding (ports + dominio + adapter stub).

## 8. Criterios de aceptación
- AC1 — `pnpm -r typecheck` ✅.
- AC2 — `pnpm -r test` ✅.
- AC3 — Migraciones aplicadas desde un Postgres limpio sin error.
- AC4 — Build de la imagen Docker termina sin error.

## 9. Riesgos
- Acoplamiento entre dominios via imports rotos → mitigado por reglas en
  `CLAUDE.md`/`AGENTS.md` y por ports inyectados.

## 10. Preguntas abiertas
Ninguna pendiente.
