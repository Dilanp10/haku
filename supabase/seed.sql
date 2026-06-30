-- Seed de catálogos base (idempotente). Se ejecuta con `pnpm db:reset`.

insert into public.categories (slug, name, icon) values
  ('cafeteria',   'Cafetería',   'coffee'),
  ('restaurante', 'Restaurante', 'utensils'),
  ('bar',         'Bar',         'beer'),
  ('panaderia',   'Panadería',   'croissant'),
  ('heladeria',   'Heladería',   'ice-cream')
on conflict (slug) do nothing;

insert into public.food_types (slug, name) values
  ('empanadas',    'Empanadas'),
  ('parrilla',     'Parrilla'),
  ('pizza',        'Pizza'),
  ('vegetariano',  'Vegetariano'),
  ('cafe',         'Café de especialidad'),
  ('postres',      'Postres'),
  ('regional',     'Comida regional')
on conflict (slug) do nothing;

insert into public.event_sources (key, name, url, type, config, active) values
  (
    'demo-catamarca',
    'Demo (eventos sintéticos)',
    'about:blank',
    'html',
    '{}',
    true
  ),
  (
    'municipalidad-cba-html',
    'Municipalidad Catamarca – Agenda HTML (ejemplo)',
    'https://www.catamarca.gob.ar/agenda',
    'html',
    '{
      "wrapper": "article.evento",
      "titleSelector": "h3.titulo",
      "dateSelector": "time",
      "dateAttr": "datetime",
      "dateFormat": "ISO",
      "descSelector": "p.descripcion",
      "linkSelector": "a.mas-info",
      "venueSelector": ".lugar",
      "addressSelector": ".direccion",
      "imageSelector": "img.portada",
      "baseUrl": "https://www.catamarca.gob.ar"
    }',
    false
  ),
  (
    'cultura-cba-ical',
    'Secretaría de Cultura Catamarca – Calendario iCal (ejemplo)',
    'https://cultura.catamarca.gob.ar/eventos/calendar.ics',
    'ical',
    '{}',
    false
  )
on conflict (key) do nothing;

-- Algunos lugares de muestra para que el descubrimiento renderice de inicio.
-- (Coordenadas aproximadas en San Fernando del Valle de Catamarca.)
with c as (select id, slug from public.categories),
     f as (select id, slug from public.food_types)
insert into public.venues (slug, name, description, category_id, address, lat, lng, price_range, status)
select v.slug, v.name, v.description, c.id, v.address, v.lat, v.lng, v.price_range::public.price_range, 'published'::public.content_status
from (values
  ('cafe-del-valle',   'Café del Valle',   'Café de especialidad y pastelería casera en el centro.',  'cafeteria',   'San Martín 100, S. F. del Valle de Catamarca', -28.4696::float8, -65.7795::float8, '$$'),
  ('empanadas-la-cuesta','Empanadas La Cuesta','Empanadas catamarqueñas al horno de barro.',          'restaurante', 'Belgrano 450, S. F. del Valle de Catamarca',   -28.4710::float8, -65.7810::float8, '$'),
  ('bar-pucara',       'Bar Pucará',       'Cervecería artesanal con música en vivo los viernes.',   'bar',         'Rivadavia 700, S. F. del Valle de Catamarca',  -28.4670::float8, -65.7770::float8, '$$')
) as v(slug, name, description, category_slug, address, lat, lng, price_range)
join c on c.slug = v.category_slug
on conflict (slug) do nothing;

-- Etiquetas (food types) de ejemplo para los venues sembrados.
insert into public.venue_food_types (venue_id, food_type_id)
select v.id, f.id
from public.venues v
join public.food_types f on
  (v.slug = 'cafe-del-valle'      and f.slug in ('cafe','postres')) or
  (v.slug = 'empanadas-la-cuesta' and f.slug in ('empanadas','regional')) or
  (v.slug = 'bar-pucara'          and f.slug in ('pizza'))
on conflict do nothing;
