# Convenciones

## Nombres
- Código (identificadores, tablas, columnas, archivos): **inglés**, `snake_case` en SQL,
  `camelCase` en TS, `PascalCase` para tipos/componentes.
- Texto de UI y documentación de producto: **español**.
- Archivos de dominio descriptivos: `venue.ts`, `list-venues.use-case.ts`,
  `supabase-core.repository.ts`, `venue.schemas.ts`.

## Paquetes
- Scope `@haku/*`. Import entre módulos solo por el nombre del paquete (API pública).
- Cada módulo expone TODO lo público desde `src/index.ts` (barrel único).

## TypeScript
- `strict` + `noUncheckedIndexedAccess`. Nada de `any`. Preferir `type` sobre `interface`
  salvo para *ports* (interfaces nombradas con sufijo `Port` o `Repository`).
- Errores de dominio tipados; resultados con `Result<T, E>` en use-cases.

## Next.js (web)
- RSC por defecto. `"use client"` solo cuando hace falta interacción/estado.
- Lectura: ISR (`export const revalidate = N`). Escritura: Server Actions con `revalidatePath`.
- Validar entrada con Zod en la frontera. Nunca usar `service_role` en componentes cliente.

## Supabase / SQL
- Una migración por cambio, idempotente donde sea posible. RLS habilitada por tabla.
- `created_at`/`updated_at timestamptz default now()`; `id uuid default gen_random_uuid()`.
- `slug` único para entidades navegables (venues, events, categorías).

## Tests
- Vitest. Use-cases con fakes de ports (unit). Adapters con test de integración opcional.
