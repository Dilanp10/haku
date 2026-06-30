-- Módulo EVENTS: ingesta de eventos. AISLADO: sin FK a tablas de core.
-- Lectura pública solo de eventos 'published' y futuros; escritura solo admin/service_role.

create type public.event_status as enum ('pending', 'published', 'rejected');
create type public.event_source_type as enum ('html', 'ical', 'api');

create table public.event_sources (
  id          uuid primary key default gen_random_uuid(),
  key         text unique not null,
  name        text not null,
  url         text not null,
  type        public.event_source_type not null default 'html',
  config      jsonb not null default '{}'::jsonb,
  active      boolean not null default true,
  last_run_at timestamptz
);

create table public.events (
  id          uuid primary key default gen_random_uuid(),
  source_key  text not null,                       -- referencia débil (NO FK a core)
  external_id text,
  slug        text unique not null,
  title       text not null,
  description text,
  starts_at   timestamptz not null,
  ends_at     timestamptz,
  venue_name  text,                                -- texto libre; NO FK a venues (aislamiento)
  address     text,
  lat         double precision,
  lng         double precision,
  url         text,
  image_url   text,
  category    text,
  status      public.event_status not null default 'pending',
  dedupe_hash text not null unique,
  raw         jsonb,
  ingested_at timestamptz not null default now()
);

create index events_starts_at_idx on public.events (starts_at);
create index events_status_idx on public.events (status);

-- ── RLS ──────────────────────────────────────────────────────────────────────
alter table public.event_sources enable row level security;
alter table public.events enable row level security;

-- event_sources: nada público. Solo admin (el job usa service_role, que saltea RLS).
create policy "event_sources_admin_all" on public.event_sources for all
  using (public.is_admin()) with check (public.is_admin());

-- events: lectura pública solo publicados y futuros.
create policy "events_read_published_future"
  on public.events for select
  using (status = 'published' and starts_at >= now());

-- Admin: moderación total (pending → published/rejected, en cualquier fecha).
create policy "events_admin_all" on public.events for all
  using (public.is_admin()) with check (public.is_admin());
