# Constitución de Haku

Principios no negociables del proyecto. Toda PR y todo agente deben respetarlos.
Inspirado en la disciplina SDD de `tuamigofiel`.

## I. Spec-Driven Development (specs primero)
Ningún módulo o feature se implementa antes de tener su `SDD.md` (en `docs/sdd/M0X-*/`)
aprobado. El orden es siempre: **SDD → Aprobación → Tasks → Implementación → Tests**. El
código sin SDD aprobado se rechaza. Metodología: skill `sdd-modular-dev`.

## II. Frontera modular estricta
Cada dominio es una carpeta en la raíz y un paquete `@haku/*`. Un módulo solo puede
importar la **API pública** (`index.ts`) de otro. Importar rutas internas
(`@haku/x/src/...`) está prohibido. Entre dominios (core/auth/events) no hay
dependencias directas: colaboran en `web` o vía `shared`.

## III. Dominio puro, infraestructura en los bordes
La lógica de negocio (`domain/`, `application/use-cases/`) no conoce Supabase, Next.js
ni `fetch`. El IO entra por **ports** (interfaces) implementados en `infrastructure/`.
Los casos de uso reciben sus dependencias por inyección (testeables sin red).

## IV. Seguridad por defecto: RLS estricta
Supabase RLS está **activada en todas las tablas**. La autorización vive en la base de
datos, no solo en la app. El cliente usa la `anon key`; la `service_role key` solo en
servidor (Server Actions, route handlers, jobs) y nunca llega al navegador.

## V. Código limpio y tipado
TypeScript en modo `strict`. Sin `any` implícito. Validación de entradas con Zod en la
frontera (Server Actions, ingesta, API). Nombres en inglés en el código; UI en español.

## VI. Aislamiento del módulo Events
La ingesta/scraping de eventos es un subsistema desacoplado: sus tablas no tienen FK a
core, sus fallos no afectan a descubrimiento, y su ingesta corre fuera del request del
usuario (cron/job). El scraping es cortés (User-Agent identificable, rate-limit, respeto
de robots/ToS de cada fuente).

## VII. Rendimiento: ISR para lectura, Server Actions para escritura
Las páginas de lectura pública usan RSC + ISR (`revalidate`). Las mutaciones usan Server
Actions que revalidan rutas afectadas. Evitar fetching en el cliente salvo interacción.

## VIII. From scratch
El código de los repos de referencia no se copia. Las referencias modelan arquitectura
(tuamigofiel) y lógica/stack (Morficat); la implementación es propia.
