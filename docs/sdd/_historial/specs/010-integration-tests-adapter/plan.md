# Plan — Integration Tests Adapter

> **Cómo** lo construimos. Escrito después de aprobar `spec.md`.

## 1. Arquitectura afectada
- **`@haku/core`** — nuevo archivo de tests de integración en `src/infrastructure/`.
- **`@haku/events`** — nuevo archivo de tests de integración en `src/infrastructure/`.
- **`.github/workflows/ci.yml`** — nuevo job `integration` paralelo al job `verify`.
- **`.env.example`** — documentar las variables `SUPABASE_URL` y `SUPABASE_SERVICE_ROLE_KEY` para tests locales.

Frontera respetada: los tests instancian los adapters directamente (no usan la API pública del paquete), lo cual es correcto porque los tests **viven dentro del paquete** (`src/infrastructure/`). No hay imports cruzados entre dominios.

No se toca `shared/`, `auth/`, `events/` desde `core/` ni viceversa.

## 2. Modelo de datos
Sin migraciones nuevas. Los tests usan las tablas existentes con fixtures de test que se insertan y eliminan en cada test.

**Convención de fixtures**: todo slug y `external_id` lleva el prefijo `__test__` para distinguirlo del seed real y facilitar el cleanup.

## 3. Diseño de ports y use-cases
No se agregan ni modifican ports ni use-cases. Los tests ejercen los adapters directamente:

```ts
// Setup compartido en ambos archivos de test
const client = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
)
const repo = createSupabaseCoreRepository(client)   // o createSupabaseEventRepository
```

## 4. Diseño de infraestructura

### Variables de entorno
Los tests leen `SUPABASE_URL` y `SUPABASE_SERVICE_ROLE_KEY` del entorno. Localmente
se cargan desde `.env.test.local` (gitignored). En CI las provee el step de `supabase start`
que imprime las credenciales de la instancia local.

### Vitest config para integración
Cada paquete tiene una config separada `vitest.integration.config.ts` que:
- Incluye solo los archivos `*.integration.test.ts`.
- No activa `passWithNoTests` (si no hay tests, es un error).
- Timeout de 15 000 ms por test (Supabase local puede tardar en responder al inicio).

El script existente `"test": "vitest run --passWithNoTests"` no cambia — sigue corriendo
solo los tests unitarios (`*.test.ts` sin `integration` en el nombre).

### Estrategia de fixtures y cleanup

```ts
// Patrón por describe-block en el archivo de integración:
let createdId: string

beforeEach(async () => {
  // INSERT fixture mínimo con slug/external_id prefijado __test__
})

afterEach(async () => {
  // DELETE por id o por slug/__test__ prefix
})
```

Para tablas con FK (`venue_food_types`) se elimina primero el hijo, luego el padre.

### Core integration test — métodos cubiertos
| Método | Fixture | Assert |
|---|---|---|
| `listVenues()` | INSERT venue `published` con slug `__test__-list` | aparece en items |
| `listVenues({ status: 'draft' })` | INSERT venue `draft` | aparece; published no |
| `getVenueBySlug(slug)` | INSERT venue | retorna venue; slug inexistente → `null` |
| `createVenue(data)` | ninguno previo | retorna venue con id; row existe en DB |
| `updateVenue(id, { name })` | INSERT venue | name cambiado; otros campos intactos |
| `listCategories()` | seed existente | array no vacío, cada item tiene id/slug/name |
| `listFoodTypes()` | seed existente | array no vacío |
| `searchVenuesNearby` | INSERT venue con lat/lng en Catamarca (-28.4, -65.7) | retorna venue dentro del radio |

> `getVenueBySlug` retorna `null` (no lanza) cuando el slug no existe — según la firma del port. El use-case `getVenueBySlug` es quien lanza `NotFoundError`.

### Events integration test — métodos cubiertos
| Método | Fixture | Assert |
|---|---|---|
| `upsertMany([e])` | ninguno previo | inserted=1; segunda llamada → inserted=0, updated=1 |
| `listUpcoming()` | INSERT event `published`, `starts_at` en futuro | aparece; evento pasado no |
| `getBySlug(slug)` | INSERT event | retorna event; slug inexistente → `null` |
| `listPending()` | INSERT event `pending` | aparece; published no |
| `updateStatus(id, 'published')` | INSERT event `pending` | status cambia a published |
| `listAll(null)` | INSERT 2 events distintos status | ambos aparecen |
| `listAll('published')` | INSERT 1 published + 1 pending | solo el published |
| `listNearby(point, 5)` | INSERT event `published` con lat/lng en Catamarca | aparece |
| `update(id, { title })` | INSERT event | title cambia; otros campos intactos |

## 5. UI / Server Actions / route handlers (`web`)
No aplica — esta feature es puramente de infraestructura de testing.

## 6. Estrategia de tests
Los tests de integración **son** la entrega. No hay tests unitarios nuevos.

Los tests unitarios existentes no se modifican ni se rompen (corren sin Supabase).

Smoke manual: correr `supabase start && pnpm db:reset && pnpm --filter @haku/core test:integration` localmente.

## 7. Riesgos del plan
- **Seed interfiere con asserts de `listCategories`/`listFoodTypes`**: El seed tiene datos
  reales; los tests solo afirman `length > 0` y la forma del objeto, no el contenido exacto.
- **`createVenue` requiere una categoría existente**: El test lee `listCategories()` primero
  para obtener un `categorySlug` real del seed. Así el fixture es independiente del id concreto.
- **`upsertMany` requiere `dedupe_hash` único**: El fixture genera un hash con prefijo
  `__test__` + timestamp para evitar colisiones con el seed.
- **CI: credenciales de Supabase local**: `supabase start` imprime `service_role key` en
  stdout; se captura con `supabase status --output json` y se exporta como env var en el job.
- **Cache de imagen Docker en CI**: se usa `actions/cache` con key basada en la versión del
  CLI de Supabase para evitar el pull de ~1 GB en cada run.

## 8. Orden de implementación
```
1. vitest.integration.config.ts en core/
   └─ 2. supabase-core.repository.integration.test.ts
         └─ 3. script test:integration en core/package.json

4. vitest.integration.config.ts en events/
   └─ 5. supabase-event.repository.integration.test.ts
         └─ 6. script test:integration en events/package.json

7. .env.example — documentar vars de test
8. .github/workflows/ci.yml — job integration
```

Los pasos 1-3 y 4-6 son paralelos entre sí (paquetes independientes).
El paso 7 no tiene dependencias. El paso 8 depende de que 3 y 6 estén listos.
