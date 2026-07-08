# Feature Spec — Rediseño visual pulido

> Documento de **qué** se construye y **por qué**. No describe cómo (eso va en
> `plan.md`). Léelo como contrato: cualquier ambigüedad acá se decide antes de planear.

## 1. Resumen
Paquete de cinco mejoras visuales que elevan la primera impresión y la sensación de
velocidad de la app sin agregar funcionalidad nueva: skeletons de carga, placeholders
de categoría para lugares sin foto, jerarquía "abierto primero" en la home, header
héroe en el detalle de lugar, y transiciones animadas entre páginas.

## 2. Motivación
La app funciona pero se percibe "a medio terminar" en cuatro momentos clave:
- Entre el splash y el contenido hay pantalla cruda mientras hidrata.
- Las cards sin foto muestran solo una inicial sobre fondo plano (3 de 8 lugares hoy).
- La home no responde visualmente su propia promesa ("¿qué está abierto ahora?"):
  todas las cards pesan igual y los abiertos quedan mezclados.
- El detalle de lugar tiene layout de plantilla; el corte entre páginas es seco.
Estas mejoras son de percepción/identidad y preparan la app para mostrarse en público
(portfolio, LinkedIn, usuarios reales).

## 3. Objetivos (en alcance)
- O1 — **Skeletons de carga**: placeholders con la silueta real del contenido
  (venue card: thumb + 2 líneas; event card: bloque fecha + 2 líneas; detalle: héroe +
  bloques) visibles durante la carga/navegación en las rutas de lectura principales:
  `/`, `/lugares`, `/eventos`, `/buscar`, `/lugares/[slug]`, `/eventos/[slug]`.
  Con animación de pulso sutil usando tokens de la paleta (`--card-2`).
- O2 — **Placeholder por categoría en cards sin foto**: en vez de la inicial del
  nombre, un fondo con color derivado de la categoría (paleta Tierra) + el ícono/emoji
  de la categoría centrado. Aplica en venue cards (home, /lugares, /buscar, favoritos)
  y en el héroe del detalle cuando no hay `coverImageUrl`.
- O3 — **Jerarquía "abierto primero" en toda lista de venues**: los lugares abiertos
  se listan antes que los no abiertos en la home, `/lugares`, `/buscar` y favoritos;
  las cards de lugares abiertos llevan un tratamiento visual sutil que las distingue
  (acento con `--moss`, p. ej. borde izquierdo o halo de fondo — decisión fina en
  plan). Los cerrados mantienen el estilo actual. Con ubicación activa: abiertos
  primero, y distancia como orden secundario dentro de cada grupo.
- O4 — **Header héroe en detalle de lugar**: imagen full-bleed (borde a borde, sin
  padding lateral) con el nombre del lugar superpuesto en la parte inferior sobre
  gradiente oscuro. El botón guardar (corazón) va superpuesto sobre la foto, esquina
  superior derecha, con fondo semitransparente para contraste y área táctil ≥44px.
  Rating y dirección van debajo del héroe. Sin foto → placeholder de categoría (O2)
  como fondo del héroe.
- O5 — **Transiciones entre páginas (View Transitions API)**: al navegar de una venue
  card al detalle, la imagen de la card se expande hacia el héroe con animación
  continua. Como mínimo, transición de cross-fade entre páginas en navegaciones de
  lectura. Progressive enhancement: en navegadores sin soporte, la navegación queda
  exactamente como hoy (sin animación, sin errores).

## 4. No-objetivos (fuera de alcance, declarados)
- N1 — Chip "cierra pronto" en ámbar (descartado explícitamente por el dueño).
- N2 — Cambios de funcionalidad: no se agregan filtros, orden configurable ni datos
  nuevos. El orden "abierto primero" es fijo, no una opción de UI.
- N3 — Rediseño del detalle de evento (solo recibe skeletons y transición genérica;
  su header no cambia en esta spec).
- N4 — Rediseño de las páginas admin.
- N5 — Fotos nuevas ni migración de imágenes de storage.

## 5. Usuarios y permisos
| Rol | Lo que puede hacer |
|---|---|
| visitor | Ve todas las mejoras; no cambia nada de permisos. |
| editor  | Ídem visitor. |
| admin   | Ídem visitor (admin no se toca, N4). |

Cambio 100 % presentacional: sin migraciones, sin RLS nueva, sin Server Actions nuevas.

## 6. Comportamiento esperado
### Caso feliz
1. El usuario abre `/`: tras el splash (si aplica) ve skeletons con forma de venue
   cards; al llegar los datos, el contenido reemplaza los skeletons sin saltos de
   layout (mismas dimensiones).
2. En la lista, los lugares abiertos aparecen primero con su acento moss; los
   cerrados después, con el estilo actual.
3. Un lugar sin foto muestra el placeholder de su categoría (color + ícono), no una
   letra.
4. Toca una card: la imagen se expande con una transición fluida hacia el héroe del
   detalle (en navegadores compatibles). El detalle muestra la foto full-bleed con el
   nombre superpuesto sobre gradiente.
5. Vuelve atrás: transición inversa.

### Edge cases
- **Ubicación activa (lat/lng en URL)**: abiertos primero; dentro de cada grupo
  (abiertos / no abiertos), orden por distancia ascendente.
- **Lugar abierto sin `closes_at` conocido**: lleva acento moss igual (el dato de
  "abierto" ya existe vía `getVenueStatuses`).
- **Horarios desconocidos** (venue sin filas de horarios): no es "cerrado"; va después
  de los abiertos, manteniendo el orden relativo actual entre no-abiertos. Solo se
  garantiza "abiertos primero".
- **Sin JS / SSR puro**: el orden abierto-primero debe venir del servidor (no un
  reordenamiento client-side que cause salto visual).
- **Navegador sin View Transitions (Firefox/Safari viejos)**: navegación normal sin
  animación; cero errores de consola.
- **Prefers-reduced-motion**: las transiciones de página y el pulso de skeletons se
  desactivan o reducen.
- **Categoría sin color/ícono mapeado**: fallback a un placeholder neutro (gris de la
  paleta + ícono genérico de lugar).

### Errores visibles
Ninguno nuevo: todo es presentacional y degrada al comportamiento actual.

## 7. Contratos de módulo afectados
- `@haku/web` únicamente (componentes, layouts, `loading.tsx`, CSS). Sin cambios de
  API pública de ningún paquete.
- `@haku/core`: **sin cambios de contrato.** El orden abierto-primero se resuelve en
  `web` con datos que ya expone (`listVenues` + `getVenueStatuses`).
- Sin migraciones Supabase. Sin cambios de RLS.

## 8. Criterios de aceptación
- AC1 — Navegando a `/`, `/lugares`, `/eventos`, `/buscar` y ambos detalles con red
  lenta (throttling), se ven skeletons con la silueta del contenido final; no hay
  layout shift perceptible al reemplazarse.
- AC2 — Un venue publicado sin `coverImageUrl` muestra placeholder con color+ícono de
  su categoría en la card y en el héroe del detalle; nunca una letra sola.
- AC3 — En `/`, `/lugares`, `/buscar` y favoritos, todo lugar abierto aparece antes
  que cualquier no abierto, y sus cards llevan el acento moss; el orden viene del
  servidor. Con ubicación activa, dentro de cada grupo el orden es por distancia.
- AC4 — El detalle de un lugar con foto muestra héroe full-bleed con nombre legible
  superpuesto (contraste suficiente sobre gradiente) en mobile y desktop.
- AC5 — En Chrome/Edge actuales, navegar card→detalle anima la imagen de forma
  continua; en un navegador sin soporte la navegación funciona idéntica a hoy.
- AC6 — Con `prefers-reduced-motion: reduce`, no hay animación de transición ni pulso.
- AC7 — `pnpm -r typecheck` y `pnpm -r test` pasan; el rendimiento de la home no
  empeora perceptiblemente (sin JS pesado nuevo en el critical path).

## 9. Riesgos y supuestos
- **Riesgo**: View Transitions con App Router tiene soporte experimental/parcial según
  versión de Next → mitigación: O5 se implementa como enhancement aislado (si la API
  del framework no alcanza, se usa `document.startViewTransition` nativo o se degrada
  a cross-fade CSS; nunca bloquea O1–O4).
- **Riesgo**: el héroe full-bleed puede chocar con el layout desktop de spec 030
  (max-width y grillas) → el plan debe definir cómo se ve el héroe en ≥ md (full-bleed
  solo hasta el contenedor, con radios).
- **Supuesto**: los emojis/íconos de categoría que hoy muestran los chips de filtros
  (🍺 ☕ 🍦 🥐 🍽) están disponibles para reusar; si no vienen de la DB, el mapeo
  color+ícono por slug de categoría vive en `web` como constante.
- **Supuesto**: `getVenueStatuses` es la fuente de verdad de "abierto ahora" y ya se
  consulta en la home (costo cero adicional).

## 10. Preguntas abiertas
Ninguna. Resueltas con el dueño (2026-07-07):
- Orden con ubicación activa → abiertos primero, distancia dentro de cada grupo.
- Acento moss → en todas las listas de venues (home, /lugares, /buscar, favoritos).
- Botón guardar en el héroe → superpuesto sobre la foto, esquina superior derecha.
