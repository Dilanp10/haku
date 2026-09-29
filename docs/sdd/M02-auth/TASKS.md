# Tasks — M02: auth

Fuente: SDD.md (Approved)

## TASK-001 — Use-cases y adapter Supabase de auth
Status: COMPLETED
Satisfies: FR-001, FR-002, FR-003, FR-005

Descripción:
`getCurrentUser`, `getProfile`, `requireRole`, `hasAtLeast`, adapter Supabase y trigger de perfil.

Completed:
- Backfill feature 002 y migración `0001_auth_profiles.sql`.

Files:
- auth/src/**
- supabase/migrations/0001_auth_profiles.sql

Tests:
- Use-cases con fakes (vitest).

SDD requirements satisfied:
- FR-001, FR-002, FR-003, FR-005

## TASK-002 — Login, logout y protección de /admin
Status: COMPLETED
Satisfies: FR-004

Descripción:
Server Action de login/logout, middleware perimetral y guarda `requireProfile('admin')`.

Completed:
- Backfill feature 002.

Files:
- web/middleware.ts
- web/app/(site)/login/**
- web/app/admin/layout.tsx

Tests:
- Verificación manual de acceso admin/anónimo.

SDD requirements satisfied:
- FR-004

## TASK-003 — Página /perfil
Status: COMPLETED
Satisfies: FR-006

Descripción:
Hub del usuario logueado (antes daba 404).

Completed:
- Backfill feature 027.

Files:
- web/app/(site)/perfil/**

Tests:
- Verificación manual.

SDD requirements satisfied:
- FR-006
