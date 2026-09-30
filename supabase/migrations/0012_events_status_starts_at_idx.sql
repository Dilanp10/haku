-- M04 events — TASK-010: índice compuesto para `listUpcoming`.
-- La consulta pública filtra por `status = 'published'` y ordena/filtra por
-- `starts_at`. Los índices existentes (`events_status_idx`, `events_starts_at_idx`)
-- solo cubren una columna cada uno; este compuesto sirve el patrón real y
-- reemplaza al `events_status_idx` (que quedaría redundante como prefijo).

create index if not exists events_status_starts_at_idx
  on public.events (status, starts_at);

drop index if exists public.events_status_idx;
