-- Índice compuesto para consultas de bounding-box en eventos cercanos.
-- Parcial: solo filas que tienen coordenadas (la mayoría de los eventos no las tienen todavía).
create index if not exists events_lat_lng_idx
  on public.events (lat, lng)
  where lat is not null and lng is not null;
