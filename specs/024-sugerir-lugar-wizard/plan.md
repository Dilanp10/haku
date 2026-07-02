# Plan — Wizard "Sugerir un lugar"

> **Cómo** lo construimos. Backfill + un fix pendiente (RLS, ver §3/§7).

## 1. Arquitectura afectada
- **`@haku/core`** — `CreateVenueData` gana `attributes?` (fix IV) además de `coverImageUrl`
  (ya en 023). El adapter `createVenue` inserta esas columnas.
- **`supabase/`** — policy `venue_images_public_suggest` en `storage.objects`.
- **`web/`** — página, wizard client, Server Action con uploads.
- No se toca `auth`/`events`. Frontera respetada: `web` es el único que orquesta Supabase +
  `@haku/core` (composition root).

## 2. Modelo de datos
Sin tabla nueva. Reusa `venues` (draft) + `venue-images` storage. La metadata transitoria
(`_hours`, `_audio_url`) vive en `venues.attributes` hasta que el admin la materializa.

## 3. Diseño de dominio, ports y use-cases
- `CreateVenueData.attributes?: Record<string, boolean>` — el use-case `createVenue` ya valida
  con Zod; se agrega `attributes` opcional. El adapter lo pasa al `INSERT`.
- **Fix IV:** hoy `actions.ts` hace INSERT + UPDATE(attributes). Nuevo diseño: pasar
  `attributes` directamente a `createVenue`, así viaja en el INSERT (permitido por
  `venues_public_suggest`) y no se necesita UPDATE (bloqueado para anónimos).

## 4. Diseño de infraestructura
### Uploads (Server Action)
```ts
const bytes = new Uint8Array(await file.arrayBuffer());
await supabase.storage.from("venue-images").upload(`suggestions/${slug}-${ts}.${ext}`, bytes, { contentType });
const { publicUrl } = supabase.storage.from("venue-images").getPublicUrl(path).data;
```
Foto → `suggestions/…`; audio → `suggestions/audio/…`. Ambos permitidos por la policy INSERT
`venue_images_public_suggest`.

### Creación del venue
`createVenue(repo, { slug, name, categorySlug ?? "restaurante", address?, location?, description?,
coverImageUrl?, attributes: { _hours, _audio_url }, status: "draft" })`.

## 5. UI / Server Actions (`web`)
| Archivo | Rol |
|---|---|
| `.../sugerir/page.tsx` | Wrapper Tierra + carga de categorías |
| `.../sugerir/suggest-form.tsx` | Wizard client 7 pasos: inputs, `MediaRecorder` (audio), file picker (foto), `HoursPicker` (multi-rango) |
| `.../sugerir/actions.ts` | Zod + uploads + `createVenue` (con `attributes` en el INSERT) |

### Detalles client
- **Audio:** `navigator.mediaDevices.getUserMedia({audio})` + `MediaRecorder` → Blob `audio/webm`.
- **Foto:** `<input type=file>` + `URL.createObjectURL` para preview; se re-inyecta en el
  `<form>` real vía `DataTransfer`.
- **Horarios:** estado `HourEntry[] = {day,opens,closes}`; UI permite varios por día.
- **Submit:** un `<form>` oculto con hidden inputs (name, categorySlug, address, lat/lng,
  description, hours JSON) + los File inputs; `requestSubmit()`.

## 6. Estrategia de tests
Sin use-cases nuevos con lógica compleja (validación es Zod en la SA). Gate:
`pnpm -r typecheck`. Verificación manual del flujo + RLS (probar como anónimo que la
metadata persiste tras el fix).

## 7. Riesgos del plan
| Riesgo | Mitigación |
|---|---|
| **RLS bloquea UPDATE anónimo** (bug IV) | Meter `attributes` en el INSERT; eliminar el UPDATE |
| Audio pesado | Límite 3MB en la SA; formato webm |
| File en Server Action desde inputs ocultos | Patrón `DataTransfer` para poblar `<input type=file>` |
| `attributes` tipado boolean con valores no-boolean | Deuda documentada; el admin limpia esas claves (025) |

## 8. Orden de implementación
```
T1 [B] storage policy venue_images_public_suggest
T2 [B] core: CreateVenueData.attributes? + adapter INSERT
   ↓
T3 [B] actions.ts: Zod, uploads, createVenue con attributes en el INSERT (fix IV)
T4 [B] suggest-form.tsx: wizard 7 pasos (audio, foto, horarios multi-rango)
T5 [P] page.tsx: wrapper Tierra
```
