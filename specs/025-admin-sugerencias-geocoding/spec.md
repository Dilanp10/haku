# Feature Spec — Revisión admin de sugerencias + geocoding

> Documento de **qué** se construye y **por qué**.
>
> **Nota de backfill:** implementado y deployado antes de la spec. Formaliza el flujo con
> el que el admin revisa lo que llega del wizard (spec 024) y ubica lugares sin coordenadas.

## 1. Resumen
El panel admin gana un **flujo de revisión de sugerencias**: cuando un venue `draft` trae
metadata del wizard (audio del usuario y horarios sugeridos), el admin la ve, escucha el
audio, y con un click **materializa los horarios** en `venue_hours`. Además, para lugares con
dirección pero sin coordenadas, un botón **geocodifica con Nominatim (OpenStreetMap)** y
guarda lat/lng, para que aparezcan en el mapa y en el orden por cercanía.

## 2. Motivación
Sin este flujo, lo que carga la comunidad (spec 024) queda enterrado en `attributes` y nunca
se publica bien: los horarios no se muestran y los lugares sin GPS no aparecen en el mapa.

## 3. Objetivos (en alcance)
- O1 — **Panel de revisión** en `/admin/lugares/[slug]`: reproductor del audio sugerido +
  lista de horarios sugeridos (Lun→Dom, multi-rango).
- O2 — Acción **"Aprobar horarios"**: materializa `attributes._hours` en `venue_hours`
  (reemplazo completo) y limpia `_hours`/`_audio_url` de `attributes`.
- O3 — Acción **"Descartar"**: limpia la metadata del wizard sin materializar.
- O4 — **Badge "Sugerencia"** en la lista admin para drafts con metadata pendiente.
- O5 — Tarjeta con **horarios ya cargados** en el detalle admin.
- O6 — **Geocoding Nominatim**: acción + botón que, dado un venue con `address` y sin
  `location`, busca lat/lng (sesgado a Catamarca/Argentina) y lo guarda.

## 4. No-objetivos (fuera de alcance, declarados)
- N1 — Autocompletar direcciones mientras el usuario escribe (solo geocoding on-demand admin).
- N2 — Reverse geocoding (coords → dirección).
- N3 — Cola de moderación con múltiples estados (se usa el `status` draft/published existente).
- N4 — Notificar al usuario que sugirió cuando se aprueba.

## 5. Usuarios y permisos
| Rol   | Lo que puede hacer                                                     |
|-------|-----------------------------------------------------------------------|
| admin | Ver/escuchar sugerencias, aprobar/descartar horarios, geocodificar.   |
| otros | Sin acceso a `/admin/*` (redirige a login).                           |

Todas las acciones llaman `requireProfile("admin")`. Geocoding y materialización corren
server-side; el update de `venues`/`venue_hours` usa la policy `venues_admin_all` /
escritura admin.

## 6. Comportamiento esperado
### Caso feliz — aprobar horarios
1. El admin abre un draft con badge "Sugerencia".
2. Ve el panel ámbar: escucha el audio y revisa los horarios sugeridos.
3. Toca "Aprobar horarios" → se insertan en `venue_hours` (reemplazando lo previo) y se
   limpian `_hours`/`_audio_url`.
4. El detalle ahora muestra los horarios como "cargados".

### Caso feliz — geocodificar
1. El venue tiene dirección pero no coordenadas → aparece "Geocodificar dirección".
2. El admin toca el botón; la SA consulta Nominatim (sesgo Catamarca).
3. Si hay match, guarda lat/lng y avisa; al recargar, el mapa muestra la ubicación.

### Edge cases
- Draft sin metadata → no aparece el panel de revisión.
- Nominatim sin resultados → mensaje "no encontramos esa dirección; cargá lat/lng a mano".
- Nominatim caído / rate-limit → mensaje de error, sin cambios.
- Horarios sugeridos con formato inválido → se filtran (regex `HH:MM`).

## 7. Contratos de módulo afectados
- **Web (Server Actions)** en `web/app/admin/lugares/actions.ts`:
  - `approveSuggestedHoursAction(venueId, slug)` — DELETE + INSERT en `venue_hours`, limpia attributes.
  - `dismissSuggestionMetaAction(venueId, slug)` — limpia `_hours`/`_audio_url`.
  - `geocodeVenueAction(id, slug, address)` — fetch Nominatim, `updateVenue(location)`.
- **Web (UI)**: `suggestion-review.tsx`, `geocode-btn.tsx` (client) + `/admin/lugares/[slug]/page.tsx`
  y `/admin/lugares/page.tsx` (badge).
- **`@haku/core`**: reusa `updateVenue` (location). Sin ports nuevos.
- **Nominatim**: servicio externo `https://nominatim.openstreetmap.org/search`. Se respeta su
  política: `User-Agent` identificable, 1 request por acción (admin, on-demand).

## 8. Criterios de aceptación
- AC1 — Draft con metadata muestra el panel con audio + horarios sugeridos.
- AC2 — "Aprobar horarios" crea las filas en `venue_hours` (incluye multi-rango) y limpia la metadata.
- AC3 — "Descartar" limpia la metadata sin crear horarios.
- AC4 — Badge "Sugerencia" visible en la lista para drafts pendientes.
- AC5 — "Geocodificar" completa lat/lng con un resultado de Nominatim válido.
- AC6 — Todas las acciones exigen rol admin.
- AC7 — `pnpm -r typecheck` pasa.

## 9. Riesgos y supuestos
- **Nominatim cortesía:** User-Agent con contacto, uso on-demand (no batch), sesgo
  `countrycodes=ar`. Cumple Principio VI (scraping/servicios cortés) aplicado a geocoding.
- **Constraint venue_hours:** la materialización multi-rango depende del drop del `UNIQUE`
  hecho en spec 023.
- **Supuesto:** el bucket es público, así el `<audio>` del panel reproduce el archivo subido.

## 10. Preguntas abiertas
_(ninguna.)_

## 11. Specs que esta feature evoluciona
- Consume la metadata que produce **024** (`_hours`, `_audio_url`) y la materializa.
- Complementa **016** (horarios) y **006** (cercanía): un lugar geocodificado entra al mapa
  y al orden por distancia de **023**.
