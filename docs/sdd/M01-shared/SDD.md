# SDD — M01: shared

## 1. Identificación
Module: M01
Name: shared (`@haku/shared`)
Status: Approved   <!-- aprobado por el usuario el 2026-09-29 (migración desde spec-kit) -->

## 2. Objetivo
Proveer primitivas neutrales compartidas por todos los módulos sin acoplarlos: manejo de
resultados y errores, esquemas Zod transversales, tipos de la base de datos y constantes
de producto. Es la única dependencia compartida permitida entre dominios.

## 3. Alcance
Incluye:
- `Result<T, E>`, `ok`, `err` y la jerarquía `AppError` (`NotFoundError`, `ValidationError`,
  `ForbiddenError`, `ConflictError`, `UnexpectedError`) con `code` estable.
- Esquemas Zod: `paginationSchema`, `geoPointSchema`, `slugSchema`.
- Tipo `Database` de Supabase y helpers `Tables`, `TablesInsert`, `TablesUpdate`.
- Constantes: `PRICE_RANGES`, `CONTENT_STATUS`, `MAP_DEFAULTS`.

No incluye:
- Lógica de negocio de ningún dominio (M02–M04).
- Instancias de clientes Supabase (solo el **tipo** `Database`).
- IO, React o Next.

## 4. Requisitos funcionales
FR-001 — Exponer `Result`/`ok`/`err` como unión discriminada `{ ok: true; value } | { ok: false; error }`.
FR-002 — Exponer la jerarquía de errores de dominio, cada una con `code` estable para UI/API.
FR-003 — Exponer los esquemas Zod de paginación (`page>=1`, `pageSize 1..100`), geo (`lat -90..90`, `lng -180..180`) y slug kebab-case.
FR-004 — Exponer el tipo `Database` y los helpers `Tables/TablesInsert/TablesUpdate`, actualizados con cada migración que cambia tablas (p. ej. `venues.attributes`, `neighborhood`, `view_count`).
FR-005 — Exponer las constantes de producto (`PRICE_RANGES`, `CONTENT_STATUS`, `MAP_DEFAULTS` centrado en Catamarca).

## 5. Requisitos no funcionales
NFR-001 — Sin dependencias de otros módulos `@haku/*`.
NFR-002 — Solo tipos, Zod y funciones puras: sin IO, sin cliente Supabase, sin React/Next.
NFR-003 — TypeScript `strict`, sin `any` implícito.

## 6. Arquitectura del módulo
`shared/src/` con `index.ts` como API pública única. Subcarpetas por responsabilidad:
result/errores, schemas, types (`database.ts`), constants.

## 7. Flujo de datos
No aplica (módulo de tipos y funciones puras, sin flujo propio).

## 8. Modelo de datos
Reexporta el tipo `Database` que refleja las tablas de `auth`, `core` y `events`. La fuente
real del esquema son las migraciones (M06); este módulo solo lo tipa.

## 9. API
No aplica (librería interna).

## 10. Seguridad
No contiene secretos ni instancia clientes. Los errores con `code` estable evitan filtrar
detalles internos a la UI.

## 11. Dependencias
Ninguna. Todos los demás módulos dependen de M01.

## 12. Criterios de aceptación
- `pnpm typecheck` y `pnpm test` pasan en el paquete.
- Ningún import de `@haku/core|auth|events|web` dentro de `shared/`.
- `Database` coincide con las migraciones vigentes.
