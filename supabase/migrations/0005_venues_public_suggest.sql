-- Permite a cualquier usuario (incluido anon) sugerir un lugar.
-- La restricción WITH CHECK garantiza que solo se puede insertar con status='draft'.
-- El admin lo revisa desde /admin/lugares antes de publicar.
create policy "venues_public_suggest"
  on public.venues for insert
  with check (status = 'draft');
