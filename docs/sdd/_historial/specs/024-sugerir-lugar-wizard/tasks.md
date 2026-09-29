# Tasks — Wizard "Sugerir un lugar"

> Derivado de `plan.md`. `[x]` = shipeado. `[ ]` = pendiente (fix mandado por la spec).

## Tareas

### Bloque 1 — Infra
- [x] T1 [B] — Storage: policy `venue_images_public_suggest` (INSERT en `suggestions/…`).

### Bloque 2 — Core
- [x] T2a [B] — `CreateVenueData.coverImageUrl?` + adapter inserta `cover_image_url`.
- [x] T2b [B] — **(fix IV)** — `CreateVenueData.attributes?: Record<string, unknown>` + Zod en
  `createVenue` + adapter inserta `attributes` en el `INSERT`.

### Bloque 3 — Web
- [x] T3 [B] — `suggest-form.tsx`: wizard 7 pasos con barra de progreso.
- [x] T4 [P] — Paso ubicación: geolocalización ("Usar mi ubicación") + dirección escrita.
- [x] T5 [P] — Paso descripción: textarea + grabación de audio (`MediaRecorder`) con preview.
- [x] T6 [P] — Paso foto: file picker con preview + validación tipo/tamaño.
- [x] T7 [P] — Paso horarios: `HoursPicker` multi-rango por día + atajos copiar.
- [x] T8 [B] — `actions.ts`: Zod (nombre + ubicación obligatorios), uploads foto/audio.
- [x] T9 [B] — **(fix IV)** — `actions.ts`: crear el venue con `createAdminSupabase()`
  (service-role) y pasar `attributes` (`_hours`, `_audio_url`) en el `INSERT`. Elimina el
  `UPDATE` post-insert y evita el fallo de readback bajo RLS para anónimos.
- [x] T10 [P] — `page.tsx`: wrapper Tierra.

## Verificación final
- [x] AC1 — 7 pasos; solo nombre + ubicación bloquean avance.
- [x] AC2 — Ubicación por GPS o dirección.
- [x] AC3 — Audio grabable y subido.
- [x] AC4 — Foto previsualizada y subida.
- [x] AC5 — Horarios multi-rango.
- [x] AC6 — **Metadata persiste también para anónimos** (service-role + attributes en INSERT).
- [x] `pnpm -r typecheck` tras el fix.
