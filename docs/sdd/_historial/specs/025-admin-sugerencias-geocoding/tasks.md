# Tasks — Revisión admin de sugerencias + geocoding

> Derivado de `plan.md`. `[x]` = shipeado.

## Tareas

### Bloque 1 — Server Actions
- [x] T1 [B] — `approveSuggestedHoursAction`: lee `attributes._hours`, DELETE+INSERT en
  `venue_hours` (filtra formato `HH:MM`), limpia `_hours`/`_audio_url`.
- [x] T2 [B] — `dismissSuggestionMetaAction`: limpia `_hours`/`_audio_url` sin materializar.
- [x] T3 [B] — `geocodeVenueAction`: fetch Nominatim (sesgo Catamarca, User-Agent), valida,
  `updateVenue(location)`.

### Bloque 2 — UI
- [x] T4 [P] — `suggestion-review.tsx`: `<audio>` + lista horarios sugeridos + botones
  Aprobar/Descartar.
- [x] T5 [P] — `geocode-btn.tsx`: dispara `geocodeVenueAction`, muestra resultado/errores.
- [x] T6 [B] — `[slug]/page.tsx`: monta el panel si hay metadata; tarjeta "horarios cargados";
  botón geocode cuando hay dirección sin coords.
- [x] T7 [P] — `admin/lugares/page.tsx`: badge "Sugerencia" para drafts con metadata.

## Verificación final
- [x] AC1 — Panel con audio + horarios en drafts con metadata.
- [x] AC2 — Aprobar horarios crea filas (multi-rango) y limpia metadata.
- [x] AC3 — Descartar limpia sin crear horarios.
- [x] AC4 — Badge "Sugerencia" en la lista.
- [x] AC5 — Geocodificar completa lat/lng.
- [x] AC6 — Acciones exigen rol admin.
- [x] `pnpm -r typecheck` pasa.
