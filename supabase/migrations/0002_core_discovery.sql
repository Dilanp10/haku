-- Módulo CORE: descubrimiento (venues, categorías, food types). RLS estricta.
-- Lectura pública solo de contenido 'published'; escritura solo admin/service_role.

create type public.content_status as enum ('draft', 'published', 'archived');
create type public.price_range as enum ('$', '$$', '$$$');

create table public.categories (
  id   uuid primary key default gen_random_uuid(),
  slug text unique not null,
  name text not null,
  icon text
);

create table public.food_types (
  id   uuid primary key default gen_random_uuid(),
  slug text unique not null,
  name text not null
);

create table public.venues (
  id              uuid primary key default gen_random_uuid(),
  slug            text unique not null,
  name            text not null,
  description     text,
  category_id     uuid not null references public.categories (id) on delete restrict,
  address         text,
  lat             double precision,
  lng             double precision,
  phone           text,
  website         text,
  instagram       text,
  price_range     public.price_range,
  cover_image_url text,
  status          public.content_status not null default 'draft',
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index venues_category_idx on public.venues (category_id);
create index venues_status_idx on public.venues (status);

create table public.venue_food_types (
  venue_id     uuid not null references public.venues (id) on delete cascade,
  food_type_id uuid not null references public.food_types (id) on delete cascade,
  primary key (venue_id, food_type_id)
);

-- updated_at automático
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end; $$;

create trigger venues_touch_updated_at
  before update on public.venues
  for each row execute function public.touch_updated_at();

-- ── RLS ──────────────────────────────────────────────────────────────────────
alter table public.categories enable row level security;
alter table public.food_types enable row level security;
alter table public.venues enable row level security;
alter table public.venue_food_types enable row level security;

-- Catálogos de apoyo: lectura pública.
create policy "categories_read_all" on public.categories for select using (true);
create policy "food_types_read_all" on public.food_types for select using (true);

-- Venues: lectura pública solo de publicados.
create policy "venues_read_published"
  on public.venues for select
  using (status = 'published');

-- Admin gestiona todo (en cualquier estado).
create policy "venues_admin_all" on public.venues for all
  using (public.is_admin()) with check (public.is_admin());
create policy "categories_admin_all" on public.categories for all
  using (public.is_admin()) with check (public.is_admin());
create policy "food_types_admin_all" on public.food_types for all
  using (public.is_admin()) with check (public.is_admin());

-- Join visible si el venue es visible (publicado) o si es admin.
create policy "vft_read"
  on public.venue_food_types for select
  using (
    exists (select 1 from public.venues v where v.id = venue_id and v.status = 'published')
    or public.is_admin()
  );
create policy "vft_admin_all" on public.venue_food_types for all
  using (public.is_admin()) with check (public.is_admin());
