-- M04 TASK-012 / FR-010: dedup entre fuentes.
-- El dedupe_hash dejó de incluir source_key: ahora identifica el "evento canónico"
-- (mismo título normalizado + misma hora exacta de starts_at), para que la misma
-- peña publicada por sfvc y por otra fuente colapse a una sola fila. Se agrega
-- `extra_sources jsonb` para preservar qué fuentes secundarias lo informaron.

-- 1. Extensión para quitar tildes y normalizar títulos en SQL.
create extension if not exists unaccent;

-- 2. normalize_title(text): idéntico al de events/src/domain/event.ts.
--    - sin tildes, minúsculas, solo alfanumérico y espacios, espacios colapsados.
--    IMMUTABLE para poder usarla en un índice o en una columna generada.
create or replace function public.normalize_title(t text)
returns text
language sql
immutable
strict
parallel safe
as $$
  select trim(
    regexp_replace(
      regexp_replace(
        lower(unaccent(t)),
        '[^a-z0-9 ]+', ' ', 'g'
      ),
      '\s+', ' ', 'g'
    )
  );
$$;

-- 3. hour_epoch_ms(timestamptz): piso a la hora, en milisegundos desde epoch.
--    Idéntico a `Math.floor(getTime() / 3_600_000) * 3_600_000` en JS.
create or replace function public.hour_epoch_ms(ts timestamptz)
returns bigint
language sql
immutable
strict
parallel safe
as $$
  select (floor(extract(epoch from ts) / 3600) * 3600 * 1000)::bigint;
$$;

-- 4. Columna nueva. Nullable mientras backfilleamos, después NOT NULL.
alter table public.events add column if not exists extra_sources jsonb not null default '[]'::jsonb;

-- 5. Backfill: recalcular dedupe_hash de todas las filas con la fórmula nueva.
--    Antes hay que quitar el UNIQUE para que las colisiones no exploten en medio
--    del UPDATE y poder resolverlas en el paso 6.
alter table public.events drop constraint if exists events_dedupe_hash_key;
drop index if exists events_dedupe_hash_key;

update public.events
set dedupe_hash = md5(
  public.normalize_title(title) || '|' || public.hour_epoch_ms(starts_at)::text
);

-- 6. Resolver colisiones: si dos filas comparten dedupe_hash (= mismo evento desde
--    dos fuentes), nos quedamos con la más vieja como canónica y acumulamos los
--    source_key del resto en su `extra_sources`. Las filas sobrantes se borran.
with ranked as (
  select
    id,
    source_key,
    dedupe_hash,
    row_number() over (
      partition by dedupe_hash
      order by ingested_at nulls last, id
    ) as rn
  from public.events
),
canonicals as (
  select dedupe_hash, id as canonical_id
  from ranked
  where rn = 1
),
losers as (
  select r.id as loser_id, r.dedupe_hash, r.source_key, c.canonical_id
  from ranked r
  join canonicals c using (dedupe_hash)
  where r.rn > 1
),
merges as (
  select
    canonical_id,
    jsonb_agg(distinct to_jsonb(source_key)) as new_sources
  from losers
  group by canonical_id
)
update public.events e
set extra_sources = (
  select jsonb_agg(distinct x)
  from jsonb_array_elements(e.extra_sources || m.new_sources) as x
)
from merges m
where e.id = m.canonical_id;

delete from public.events
where id in (
  select r.id
  from (
    select
      id,
      row_number() over (
        partition by dedupe_hash
        order by ingested_at nulls last, id
      ) as rn
    from public.events
  ) r
  where r.rn > 1
);

-- 7. Volver a aplicar UNIQUE sobre el hash recomputado.
create unique index events_dedupe_hash_key on public.events (dedupe_hash);
