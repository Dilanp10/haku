# Arquitectura

Resumen ejecutable; el contrato vinculante es [`docs/sdd/ARCHITECTURE.md`](./sdd/ARCHITECTURE.md).

## Estilo
Monolito modular de **cortes verticales**. Cada dominio (carpeta en raíz, paquete
`@haku/*`) contiene su propio dominio + aplicación + infraestructura y expone una sola
API pública (`index.ts`). `web` (Next.js) es el *composition root*: la única capa que
ensambla los módulos e inyecta la infraestructura (cliente Supabase) en los use-cases.

## Capas dentro de un módulo (hexagonal-lite)
```
domain/        entidades + reglas puras (sin IO)
application/
  ports/       interfaces hacia el exterior (repos, fuentes)
  use-cases/   orquestan domain + ports; reciben deps por inyección
infrastructure/ adapters concretos (Supabase) que implementan los ports
index.ts       API pública
```
Ventaja: los use-cases se testean con fakes de los ports, sin red ni Supabase.

## Por qué cortes verticales (y no capas globales)
La instrucción de diseño pide "cada dominio = carpeta en la raíz" y frontera estricta.
Los cortes verticales hacen explícito el límite del dominio y permiten que `events`
sea verdaderamente desacoplable (puede fallar/escalar aparte). `shared` evita
duplicación sin acoplar dominios entre sí.

## Composition root (web)
```ts
// web: ejemplo de cableado (pseudo)
const supabase = createServerClient();
const coreRepo = createSupabaseCoreRepository(supabase);
const venues = await listVenues(coreRepo, { categorySlug });
```
Solo `web` conoce a `core`, `auth` y `events` simultáneamente. Los dominios no se
conocen entre sí.

## Datos y seguridad
Supabase con RLS en todas las tablas. Lectura pública limitada a `status='published'`;
escritura por `admin`/`service_role`. Detalle en `supabase/migrations/`.
