-- Horarios de atención por día de la semana para cada venue.
CREATE TABLE public.venue_hours (
  id          uuid     NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  venue_id    uuid     NOT NULL REFERENCES public.venues (id) ON DELETE CASCADE,
  day_of_week smallint NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
  opens_at    time     NOT NULL,
  closes_at   time     NOT NULL,
  closed      boolean  NOT NULL DEFAULT false,
  UNIQUE (venue_id, day_of_week)
);

ALTER TABLE public.venue_hours ENABLE ROW LEVEL SECURITY;

-- Lectura pública: cualquier visitante puede ver los horarios.
CREATE POLICY "venue_hours_public_select"
  ON public.venue_hours FOR SELECT
  USING (true);

-- Escritura solo via service_role (Server Action admin con createAdminSupabase).
-- No se definen políticas INSERT/UPDATE/DELETE para anon/authenticated.
