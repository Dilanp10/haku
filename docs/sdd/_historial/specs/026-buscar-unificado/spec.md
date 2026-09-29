# Feature Spec — Búsqueda unificada (`/buscar`) con cards compartidas

> Documento de **qué** se construye y **por qué**. Feature **nueva** (no backfill): se
> implementa siguiendo el flujo SDD completo.

## 1. Resumen
`/buscar` ya usa la paleta Tierra, pero renderiza los resultados con **markup de filas
ad-hoc** (sin thumbnail, sin estado abierto/cerrado, sin distancia) que quedó **inconsistente**
con el resto de los listados, que usan los componentes compartidos `VenueCard` / `EventCard`.
Esta feature unifica `/buscar` para que use esos componentes y herede el sistema de
descubrimiento (thumbnail 64px, "abierto ahora", barrio) de la spec 023.

## 2. Motivación
La incoherencia visual entre `/buscar` y `/lugares`/`/eventos` rompe la sensación de producto
terminado: un mismo lugar se ve distinto según desde dónde se llegue. Reusar los componentes
compartidos elimina duplicación y da consistencia (y de paso muestra si el resultado está
abierto ahora, señal clave de la app).

## 3. Objetivos (en alcance)
- O1 — Reemplazar el markup ad-hoc de resultados de lugares por `<VenueCard>` (con thumbnail,
  categoría, barrio y estado abierto/cerrado).
- O2 — Reemplazar el markup ad-hoc de resultados de eventos por `<EventCard>`.
- O3 — Calcular el estado "abierto ahora" de los lugares resultantes (reusar `getVenueStatuses`).
- O4 — Mantener el buscador, el conteo de resultados, el empty-state y los links "Ver todos".
- O5 — Mantenerse en `force-dynamic` y `robots: noindex` (página de utilidad).

## 4. No-objetivos (fuera de alcance, declarados)
- N1 — Filtros avanzados dentro de `/buscar` (viven en `/lugares`; acá hay solo texto libre).
- N2 — Orden por cercanía en `/buscar` (se ofrece en los listados; la búsqueda es por relevancia textual).
- N3 — Búsqueda con autocompletado / typeahead.
- N4 — Paginación en `/buscar` (se muestran hasta 6 de cada tipo + link "ver todos").
- N5 — Cambios en la lógica de búsqueda de `core`/`events` (se usa el `search` existente).

## 5. Usuarios y permisos
Sin cambios de permisos. Cualquier visitante busca lugares y eventos públicos.

## 6. Comportamiento esperado
### Caso feliz
1. El usuario escribe un término y envía (o llega con `?q=...`).
2. La página busca lugares y eventos (hasta 6 c/u) y muestra los resultados con las cards
   compartidas: los lugares con thumbnail y "● Abierto · cierra a las HH:MM" si corresponde.
3. Si hay más de 6 lugares, aparece "Ver los N" → `/lugares?q=...`.

### Edge cases
- Sin `q` → estado inicial invitando a buscar (sin llamadas a la DB).
- `q` sin resultados → empty-state con links a todos los lugares/eventos.
- Lugar sin horarios → la card no muestra estado (consistente con 023).

## 7. Contratos de módulo afectados
Ninguno en `core`/`events` (se reusa `search` de `listVenues` / `listUpcomingEvents`).
Solo `web/app/(site)/buscar/page.tsx`:
- Importa `VenueCard`, `EventCard`, `getVenueStatuses`.
- Elimina el markup `<li>` ad-hoc.

## 8. Criterios de aceptación
- AC1 — Los resultados de lugares se renderizan con `<VenueCard>` (thumbnail + categoría + barrio).
- AC2 — Los resultados de eventos se renderizan con `<EventCard>`.
- AC3 — Los lugares abiertos muestran el estado "abierto ahora"; los cerrados, "Cerrado".
- AC4 — Se conservan buscador, conteo, empty-state y links "Ver todos".
- AC5 — `pnpm -r typecheck` pasa.
- AC6 — Verificación visual: `/buscar?q=cafe` se ve consistente con `/lugares`.

## 9. Riesgos y supuestos
- **Costo extra:** agrega una query de `getVenueStatuses` cuando hay `q`. Aceptable (misma que
  usa `/lugares`). Si no hay `q`, no se consulta nada.
- **Supuesto:** `VenueCard`/`EventCard` ya aceptan las props necesarias (openNow, closesAt,
  category) — provisto por spec 023.

## 10. Preguntas abiertas
_(ninguna.)_

## 11. Specs que esta feature evoluciona
- Alinea `/buscar` con el sistema de cards de **022** y el estado de descubrimiento de **023**.
