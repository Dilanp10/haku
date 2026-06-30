-- Módulo AUTH: perfiles y roles. RLS estricta.
-- Constitución IV: la autorización vive en la BD, no solo en la app.

create type public.user_role as enum ('visitor', 'editor', 'admin');

create table public.profiles (
  id           uuid primary key references auth.users (id) on delete cascade,
  display_name text,
  role         public.user_role not null default 'visitor',
  avatar_url   text,
  created_at   timestamptz not null default now()
);

alter table public.profiles enable row level security;

-- Lectura: el usuario ve su propio perfil. (Ampliable a público no sensible más adelante.)
create policy "profiles_select_own"
  on public.profiles for select
  using (auth.uid() = id);

-- Actualización: solo el propio perfil. El cambio de `role` se restringe abajo.
create policy "profiles_update_own"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- Helper: ¿el usuario actual es admin? (security definer para evitar recursión de RLS)
create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role = 'admin'
  );
$$;

-- Un admin puede ver y gestionar todos los perfiles.
create policy "profiles_admin_all"
  on public.profiles for all
  using (public.is_admin())
  with check (public.is_admin());

-- Trigger: crear perfil automáticamente al registrarse (rol inicial 'visitor').
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'display_name', split_part(new.email, '@', 1)));
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
