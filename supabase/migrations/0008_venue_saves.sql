-- Favoritos de usuarios: cada usuario guarda venues que le interesan.
CREATE TABLE public.venue_saves (
  user_id    uuid NOT NULL REFERENCES auth.users   (id) ON DELETE CASCADE,
  venue_id   uuid NOT NULL REFERENCES public.venues (id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, venue_id)
);

ALTER TABLE public.venue_saves ENABLE ROW LEVEL SECURITY;

-- Cada usuario solo ve sus propios saves.
CREATE POLICY "venue_saves_own_select"
  ON public.venue_saves FOR SELECT
  USING (auth.uid() = user_id);

-- Cada usuario solo inserta sus propios saves.
CREATE POLICY "venue_saves_own_insert"
  ON public.venue_saves FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Cada usuario solo borra sus propios saves.
CREATE POLICY "venue_saves_own_delete"
  ON public.venue_saves FOR DELETE
  USING (auth.uid() = user_id);
