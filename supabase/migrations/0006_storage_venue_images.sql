-- Bucket publico para imagenes de venues. Lectura libre; escritura solo admin.
insert into storage.buckets (id, name, public)
values ('venue-images', 'venue-images', true)
on conflict (id) do nothing;

create policy "venue_images_public_read"
  on storage.objects for select
  using (bucket_id = 'venue-images');

create policy "venue_images_admin_write"
  on storage.objects for insert
  with check (bucket_id = 'venue-images' and public.is_admin());

create policy "venue_images_admin_update"
  on storage.objects for update
  using (bucket_id = 'venue-images' and public.is_admin());

create policy "venue_images_admin_delete"
  on storage.objects for delete
  using (bucket_id = 'venue-images' and public.is_admin());
