# Decisiones de arquitectura (ADR resumido)

## ADR-001 — Monolito modular de cortes verticales
**Contexto:** la instrucción pide "cada dominio = carpeta en la raíz" + frontera estricta,
con stack de Morficat (Next.js). **Decisión:** monorepo pnpm con un paquete `@haku/*` por
dominio en la raíz; `web` como composition root. **Alternativa descartada:** capas
globales (core/infrastructure/shared como en tuamigofiel) — oculta el límite del dominio
y dificulta aislar Events. **Consecuencia:** imports solo por API pública; sin imports
cruzados entre dominios.

## ADR-002 — Supabase en lugar de Prisma
**Contexto:** tuamigofiel usa Prisma/better-auth; el stack objetivo (Morficat) es Supabase.
**Decisión:** Supabase (Postgres + Auth + Storage) con RLS estricta; persistencia vía
`@supabase/supabase-js` detrás de ports. **Consecuencia:** la autorización vive en la BD;
los adapters de infraestructura hablan con Supabase, no con un ORM.

## ADR-003 — Events totalmente desacoplado
**Decisión:** tablas `event_*` sin FK a core; ingesta fuera del request (cron/job) con
`service_role`; lectura pública por ISR. **Razón:** un fallo de scraping no puede tumbar
descubrimiento; las fuentes son volátiles. **Consecuencia:** posible duplicación de
conceptos (ubicación) entre core y events; se acepta a cambio de aislamiento.

## ADR-004 — Dominio de Core = descubrimiento (no task management)
**Contexto:** la instrucción mencionaba "task management", pero el repo Morficat real es
descubrimiento gastronómico de Catamarca, y Events encaja con descubrimiento.
**Decisión (confirmada con el usuario):** Core es descubrimiento hiperlocal.

## ADR-005 — From scratch
No se reutiliza código de los repos de referencia; solo modelan arquitectura y lógica.
