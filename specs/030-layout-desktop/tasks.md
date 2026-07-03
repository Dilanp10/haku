# Tasks — Layout de escritorio

> Solo variantes responsive `md:`; la vista mobile NO cambia.

## Tareas
- [x] T1 [B] — `site-nav.tsx`: nav de escritorio con Inicio, Lugares, Eventos, Mapa, Buscar, Más
  (`hidden md:flex`), estado activo por pathname. Mobile intacto.
- [x] T2 [P] — `site-footer.tsx`: restyle con tokens Tierra + links Buscar/Más.
- [x] T3 [B] — Home: contenedor `md:max-w-5xl`; secciones de lugares y eventos en
  `md:grid md:grid-cols-2 md:gap-x-8`.
- [x] T4 [B] — `/lugares` y `/eventos`: contenedor `md:max-w-5xl`; resultados en grilla 2 col.
- [x] T5 [B] — `/buscar`: contenedor `md:max-w-5xl`; secciones lugares/eventos en grilla 2 col.
- [x] T6 [B] — `/perfil/favoritos`: contenedor `md:max-w-5xl`; lista en grilla 2 col.
- [x] T7 [B] — `pnpm -r typecheck` + build + deploy + verificación desktop/mobile.

## Verificación final (definition of done)
- [x] AC1 — Nav desktop con todas las secciones.
- [x] AC2 — Home y listas en 2 columnas en desktop.
- [x] AC3 — Mobile sin cambios.
- [x] AC4 — Detalle en columna angosta.
- [x] AC5 — `pnpm -r typecheck` pasa.
