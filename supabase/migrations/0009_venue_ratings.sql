-- Ratings de usuarios: puntuación 1–5 por venue, un voto por usuario (upsertable).
CREATE TABLE public.venue_ratings (
  user_id    uuid     NOT NULL REFERENCES auth.users   (id) ON DELETE CASCADE,
  venue_id   uuid     NOT NULL REFERENCES public.venues (id) ON DELETE CASCADE,
  rating     smallint NOT NULL CHECK (rating BETWEEN 1 AND 5),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, venue_id)
);

ALTER TABLE public.venue_ratings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "venue_ratings_own_select"
  ON public.venue_ratings FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "venue_ratings_own_insert"
  ON public.venue_ratings FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "venue_ratings_own_update"
  ON public.venue_ratings FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "venue_ratings_own_delete"
  ON public.venue_ratings FOR DELETE
  USING (auth.uid() = user_id);

-- Vista pública: promedio y conteo por venue, sin exponer user_id.
CREATE VIEW public.venue_rating_stats AS
  SELECT
    venue_id,
    ROUND(AVG(rating)::numeric, 1) AS average_rating,
    COUNT(*)::int                   AS rating_count
  FROM public.venue_ratings
  GROUP BY venue_id;

-- Permisos de lectura en la vista (datos agregados, no personales).
GRANT SELECT ON public.venue_rating_stats TO anon, authenticated;
