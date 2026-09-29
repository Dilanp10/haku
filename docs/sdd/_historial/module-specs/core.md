# SPEC — `@haku/core` (Descubrimiento)

> Dominio central de Haku: descubrir **lugares/gastronomía** de Catamarca.
> Depende solo de `@haku/shared`. No conoce a `auth` ni a `events`.

## 1. Responsabilidad
Modelar y servir el catálogo descubrible: **venues** (lugares) clasificados por
**categoría** y etiquetados con **food types**, con búsqueda por cercanía geográfica y
filtros. Provee lectura pública y, en fase posterior, mutaciones administrativas.

## 2. Modelo de dominio
- **Venue**: `id, slug, name, description, categoryId, address, location{lat,lng},
  phone?, website?, instagram?, priceRange?, coverImageUrl?, status, createdAt, updatedAt`.
- **Category**: `id, slug, name, icon?`.
- **FoodType**: `id, slug, name`.
- Relación N–N **Venue ↔ FoodType** (`venue_food_types`).
- Reglas puras (en `domain/`): validación de `slug`, normalización de nombre,
  cálculo de distancia (haversine) para ordenar por cercanía.

## 3. Ports (interfaces que la infraestructura implementa)
```ts
interface CoreRepository {
  listVenues(query: ListVenuesQuery): Promise<Paginated<Venue>>;
  getVenueBySlug(slug: string): Promise<Venue | null>;
  searchVenuesNearby(point: GeoPoint, radiusKm: number, limit: number): Promise<Venue[]>;
  listCategories(): Promise<Category[]>;
  listFoodTypes(): Promise<FoodType[]>;
}
```
`ListVenuesQuery`: `{ categorySlug?, foodTypeSlug?, priceRange?, search?, pagination }`.

## 4. Casos de uso (API pública)
| Use-case | Entrada | Salida |
|---|---|---|
| `listVenues` | `CoreRepository`, `ListVenuesInput` | `Result<Paginated<Venue>>` |
| `getVenueBySlug` | `CoreRepository`, `slug` | `Result<Venue>` (NotFound si no existe) |
| `searchVenuesNearby` | `CoreRepository`, `GeoPoint`, `radiusKm` | `Result<Venue[]>` |
| `listCategories` | `CoreRepository` | `Result<Category[]>` |
| `listFoodTypes` | `CoreRepository` | `Result<FoodType[]>` |

Los use-cases validan entrada con Zod y devuelven `Result` (nunca lanzan en flujo normal).
Reciben el `CoreRepository` por inyección → testeables con un fake.

## 5. Infraestructura
`createSupabaseCoreRepository(client: SupabaseClient<Database>): CoreRepository`.
Traduce filas Supabase ↔ entidades de dominio. No filtra por permisos: la **RLS** de
Postgres garantiza que la `anon key` solo ve `status='published'`.

## 6. Datos / RLS (ver `supabase/migrations`)
Tablas `categories`, `food_types`, `venues`, `venue_food_types`. RLS:
- `SELECT` público solo de `venues.status='published'` (y catálogos de apoyo).
- `INSERT/UPDATE/DELETE` solo `admin` o `service_role`.

## 7. Contrato de salida hacia `web`
`web` importa `@haku/core` y crea el repo con el cliente Supabase del request. Renderiza
con ISR la lista/detalle; las mutaciones (fase 2) pasan por Server Actions previa
verificación de rol con `@haku/auth` (en `web`, no aquí).

## 8. No-objetivos
- No gestiona sesión/permisos (eso es `auth`).
- No conoce eventos (eso es `events`).
- No expone el cliente Supabase ni tablas crudas.
