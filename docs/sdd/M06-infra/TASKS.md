# Tasks — M06: infra (deploy y Supabase)

Fuente: SDD.md (Approved)

## TASK-001 — Migraciones Supabase con RLS y seed
Status: COMPLETED
Satisfies: FR-001, FR-002

Descripción:
Migraciones 0001–0011 (auth, core, events, geo, sugerencias públicas, storage, vistas, saves, ratings, horarios, push) y `seed.sql`.

## TASK-002 — Docker, Skaffold y manifiestos
Status: COMPLETED
Satisfies: FR-004
Fuente: 001-project-bootstrap, 019-despliegue-skaffold-cluster-real (T1–T4)

Descripción:
`Dockerfile`, `docker-compose.yml`, `skaffold.yaml` y `deploy/`.

## TASK-003 — CI con job de integración
Status: COMPLETED
Satisfies: FR-003, FR-006
Fuente: 010-integration-tests-adapter

Descripción:
`ci.yml` con job `integration` y variables de test en `.env.example`.

## TASK-004 — Keep-alive de Supabase
Status: COMPLETED
Satisfies: FR-005

Descripción:
`.github/workflows/supabase-keepalive.yml` para evitar la pausa del plan gratuito.

## TASK-005 — Verificar el despliegue en un cluster real
Status: PENDING
Satisfies: FR-004

Descripción:
Ejecutar el T5 de la feature 019 (requiere cluster real) y confirmar AC1–AC6. Alternativa a evaluar con vos: dar por bueno el despliegue actual en Vercel y ajustar el requisito.
