-- Contador de visitas por venue.
ALTER TABLE public.venues
  ADD COLUMN view_count bigint NOT NULL DEFAULT 0;

-- RPC SECURITY DEFINER: puede hacer UPDATE aunque la RLS prohíba UPDATE anon.
-- Solo incrementa venues publicados para evitar inflación de drafts/archived.
CREATE OR REPLACE FUNCTION public.increment_venue_views(venue_slug text)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  UPDATE public.venues
  SET view_count = view_count + 1
  WHERE slug = venue_slug AND status = 'published';
$$;
