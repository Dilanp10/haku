# Feature Spec — Wizard "Sugerir un lugar"

> Documento de **qué** se construye y **por qué**.
>
> **Nota de backfill:** implementado y deployado antes de la spec. Este documento lo
> formaliza y **registra un bug de RLS detectado en la revisión de constitución** (§9, IV)
> que la implementación debe corregir.

## 1. Resumen
La página `/lugares/sugerir` pasa de un formulario único a un **wizard mobile-first de 7
pasos** (uno por pantalla), pensado para que cualquier vecino cargue un lugar rápido y sin
fricción: nombre, categoría, ubicación (GPS o dirección), descripción **con opción de audio**,
foto, horarios (multi-rango por día) y revisión. Solo **nombre** y **ubicación** son
obligatorios. La sugerencia entra como venue `draft` para revisión del admin (spec 025).

## 2. Motivación
El formulario largo desalienta la carga comunitaria. Un wizard con un campo por pantalla,
grabación de audio y captura de ubicación por GPS baja la barrera y aumenta las sugerencias.

## 3. Objetivos (en alcance)
- O1 — Wizard de 7 pasos con barra de progreso y navegación Atrás/Siguiente.
- O2 — **Paso ubicación**: botón "Usar mi ubicación actual" (geolocalización → lat/lng) **o**
  dirección escrita. Obligatorio: al menos uno.
- O3 — **Paso descripción**: textarea **+ grabación de audio** (MediaRecorder) con preview.
- O4 — **Paso foto**: selección de imagen con preview y validación (jpg/png/webp, ≤5MB).
- O5 — **Paso horarios**: multi-rango por día (turno mañana + tarde), con atajos
  "copiar Lunes a Mar–Vie / a todos". Opcional.
- O6 — **Uploads** a Supabase Storage (`venue-images/suggestions/…`) para foto y audio.
- O7 — Persistencia como venue `status='draft'`; solo nombre y ubicación obligatorios.
- O8 — Los horarios sugeridos y la URL del audio se guardan como metadata para que el admin
  los revise (spec 025).

## 4. No-objetivos (fuera de alcance, declarados)
- N1 — Teléfono, sitio web e Instagram (se quitan del wizard; el admin los agrega si aplica).
- N2 — Panel de revisión/aprobación admin (spec 025).
- N3 — Geocodificación de la dirección (spec 025).
- N4 — Moderación automática / anti-spam de sugerencias.
- N5 — Edición posterior por el usuario que sugirió.

## 5. Usuarios y permisos
| Rol      | Lo que puede hacer                                                  |
|----------|--------------------------------------------------------------------|
| visitor (anónimo) | Completar y enviar el wizard; crea un venue `draft`.      |
| authenticated | Igual que visitor.                                            |
| admin    | Además revisa/aprueba la sugerencia (spec 025).                    |

> **RLS:** el INSERT anónimo de un venue `draft` está permitido por la policy
> `venues_public_suggest`. **No existe** policy de UPDATE para anónimos (ver §9).

## 6. Comportamiento esperado
### Caso feliz
1. El usuario abre `/lugares/sugerir`.
2. Paso 1: escribe el nombre (obligatorio, ≥2 chars).
3. Paso 2: elige categoría (opcional; default `restaurante` si omite).
4. Paso 3: toca "Usar mi ubicación" o escribe dirección (obligatorio: uno de los dos).
5. Paso 4: escribe y/o graba un audio describiendo el lugar.
6. Paso 5: adjunta una foto (opcional).
7. Paso 6: carga horarios con rangos múltiples por día (opcional).
8. Paso 7: revisa el resumen y envía.
9. La Server Action sube foto/audio, crea el venue `draft` y guarda la metadata de horarios/audio.
10. Pantalla de éxito.

### Edge cases
- Sin nombre o sin ubicación → la SA rechaza con error de campo.
- Foto > 5MB o tipo no soportado → error, no se crea el venue.
- Permiso de micrófono/ubicación denegado → mensaje de ayuda; el usuario puede continuar
  (ambos pasos son opcionales salvo la ubicación, que acepta dirección escrita).
- Audio subido pero sin descripción escrita → válido (el audio reemplaza el texto).

## 7. Contratos de módulo afectados

### Base de datos — Storage
Policy nueva en `storage.objects` (bucket `venue-images`):
```sql
CREATE POLICY "venue_images_public_suggest" ON storage.objects
FOR INSERT TO public
WITH CHECK (bucket_id = 'venue-images' AND (storage.foldername(name))[1] = 'suggestions');
```

### `@haku/core` — `CreateVenueData`
```ts
coverImageUrl?: string | undefined;   // ya agregado en 023
attributes?: Record<string, boolean>; // NUEVO (fix IV): permite pasar metadata en el INSERT
```
> **Fix IV (RLS):** la metadata del wizard (`_hours`, `_audio_url`) debe viajar en el INSERT
> inicial, no en un UPDATE posterior (ver §9).

### Web
- `web/app/(site)/lugares/sugerir/page.tsx` — wrapper Tierra.
- `web/app/(site)/lugares/sugerir/suggest-form.tsx` — wizard client (7 pasos, audio, foto, horarios).
- `web/app/(site)/lugares/sugerir/actions.ts` — Server Action: validación Zod, uploads, `createVenue`.

## 8. Criterios de aceptación
- AC1 — El wizard tiene 7 pasos con barra de progreso; solo nombre y ubicación bloquean el avance.
- AC2 — "Usar mi ubicación" captura lat/lng; alternativamente se acepta dirección escrita.
- AC3 — Se puede grabar y previsualizar un audio; se sube a storage.
- AC4 — La foto se previsualiza y se sube (validación tipo/tamaño).
- AC5 — Los horarios admiten múltiples rangos por día.
- AC6 — Al enviar, se crea un venue `draft` y **la metadata de horarios/audio se persiste**
  (también para usuarios anónimos) — ver Fix IV.
- AC7 — `pnpm -r typecheck` pasa.

## 9. Riesgos y supuestos
- **❌ Bug IV (RLS) a corregir:** la implementación actual hace `INSERT` (OK por
  `venues_public_suggest`) y luego `UPDATE venues SET attributes` para guardar `_hours`/
  `_audio_url`. No hay policy de UPDATE para anónimos → **para usuarios no logueados la
  metadata se pierde silenciosamente**. **Corrección mandada:** incluir `attributes` en el
  `INSERT` (extender `CreateVenueData.attributes` y el adapter), eliminando el UPDATE.
- **⚠️ Tipado (V):** `attributes` se tipa `Record<string, boolean>` pero `_hours` es un array
  y `_audio_url` un string. Se acepta como metadata transitoria del draft (el admin la
  materializa en spec 025 y limpia esas claves). Documentado como deuda menor.
- **Supuesto:** el bucket `venue-images` es público (lectura), así el audio/foto sugeridos se
  pueden previsualizar en el panel admin.

## 10. Preguntas abiertas
_(ninguna — feature en producción; el Fix IV es trabajo pendiente derivado de esta spec.)_

## 11. Specs que esta feature evoluciona
- Reemplaza el formulario simple de sugerencia previo (parte de 003/017). Quita teléfono/web/
  Instagram del flujo de sugerencia (N1).
