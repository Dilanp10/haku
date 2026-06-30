# SPEC — `@haku/shared`

> Base común. **No depende de ningún otro módulo.** Es la única dependencia compartida
> permitida entre dominios.

## Propósito
Evitar duplicación y acoplamiento entre dominios proveyendo primitivas neutrales:
manejo de resultados/errores, esquemas Zod transversales, tipos de la base de datos y
constantes de producto.

## API pública (`src/index.ts`)

### Resultados y errores
- `Result<T, E>` — unión discriminada `{ ok: true; value } | { ok: false; error }`.
- `ok(value)`, `err(error)` — constructores.
- `AppError` (base) y subtipos: `NotFoundError`, `ValidationError`, `ForbiddenError`,
  `ConflictError`, `UnexpectedError`. Cada uno con `code` estable para la UI/API.

### Esquemas Zod transversales
- `paginationSchema` → `{ page: number>=1, pageSize: 1..100 }`.
- `geoPointSchema` → `{ lat: -90..90, lng: -180..180 }`.
- `slugSchema` → string kebab-case válido.

### Tipos de datos
- `Database` — tipo generado de Supabase (placeholder hasta correr `supabase gen types`).
- Helpers `Tables<'venues'>`, `TablesInsert<...>`, `TablesUpdate<...>`.

### Constantes
- `PRICE_RANGES` (`$`, `$$`, `$$$`), `CONTENT_STATUS` (`draft|published|archived`),
  `MAP_DEFAULTS` (centro Catamarca, zoom).

## Reglas
- Sin IO, sin Supabase client, sin React/Next. Solo tipos, Zod y funciones puras.
- Cualquier tipo que cruce frontera de módulo debería poder vivir aquí.

## No-objetivos
- No contiene lógica de negocio de ningún dominio.
- No instancia clientes; solo el **tipo** `Database`.
