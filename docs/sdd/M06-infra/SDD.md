# SDD — M06: infra (deploy y Supabase)

## 1. Identificación
Module: M06
Name: infra — base de datos, contenedores, CI y despliegue
Status: Approved   <!-- aprobado por el usuario el 2026-09-29 (migración desde spec-kit) -->

## 2. Objetivo
Mantener la infraestructura que soporta a los módulos: migraciones Supabase con RLS,
contenedores, CI y el pipeline de despliegue a producción.

## 3. Alcance
Incluye:
- `supabase/migrations` (0001–0011), `seed.sql`, storage `venue-images`.
- `Dockerfile`, `docker-compose.yml`, `skaffold.yaml`, manifiestos en `deploy/`, `vercel.json`.
- Workflows de `.github` (`ci.yml`, `deploy.yml`, `supabase-keepalive.yml`).
- Variables de entorno documentadas en `.env.example`.

No incluye:
- Lógica de negocio (M01–M05).

## 4. Requisitos funcionales
FR-001 — Toda tabla nueva llega por migración numerada con RLS activada y políticas explícitas.
FR-002 — `supabase db reset` aplica migraciones y seed sin errores.
FR-003 — CI ejecuta typecheck y tests unitarios, y un job de integración contra Supabase local.
FR-004 — `skaffold run` (o el workflow `deploy.yml`) construye la imagen, la sube a un registry y despliega con las variables correctas.
FR-005 — Un workflow mantiene activo el proyecto Supabase del plan gratuito (keep-alive cada ~5 días).
FR-006 — `.env.example` documenta cada variable requerida, incluidas las de tests de integración.

## 5. Requisitos no funcionales
NFR-001 — RLS estricta en todas las tablas (constitución IV).
NFR-002 — Secretos fuera del repo; `service_role` nunca en el cliente.
NFR-003 — Despliegue reproducible desde el repo.

## 6. Arquitectura del módulo
Migraciones SQL → Supabase. Imagen Docker de `web` → registry → cluster Kubernetes (Skaffold) o Vercel (`vercel.json`). CI en GitHub Actions.

## 7. Flujo de datos
Push a `main` → `ci.yml` (typecheck, test, integración) → `deploy.yml` → imagen → despliegue.

## 8. Modelo de datos
Esquema `public`: `profiles`; `categories`, `food_types`, `venues`, `venue_food_types`, `venue_hours`, `venue_saves`, `venue_ratings`; `event_sources`, `events`; `push_subscriptions`.

## 9. API
`GET /api/health` como probe de despliegue (implementado en M05).

## 10. Seguridad
RLS por tabla; storage con políticas; secretos en variables de entorno del proveedor y de GitHub Actions.

## 11. Dependencias
Sirve a todos los módulos. Requiere cuenta de Supabase y, para FR-004, un cluster o proveedor real.

## 12. Criterios de aceptación
- Migraciones y seed aplican limpios; CI en verde.
- Despliegue real verificado con AC1–AC6 de la feature 019 (pendiente).
