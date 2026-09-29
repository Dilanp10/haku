# Feature Spec — Rediseño del panel admin (estilo morficat / Tierra oscuro)

> Documento de **qué** se construye y **por qué**. Feature nueva (flujo SDD completo).

## 1. Resumen
El panel `/admin` usa hoy los defaults utilitarios de shadcn (grises, cards con borde) y no
comparte la identidad Tierra del sitio. Esta feature lo rediseña para que se vea **igual al
admin de morficat**: **tema oscuro Tierra** siempre, header con título terracota, lista de
lugares tipo tabla (Nombre+slug / Categoría con emoji / Estado / Editar), formularios de
crear/editar seccionados (BÁSICO, UBICACIÓN, CONTACTO, IMAGEN, TIPOS, ATRIBUTOS, HORARIOS,
ESTADO), y una pantalla de **Sugerencias**.

## 2. Motivación
El admin desentonaba con el resto de la app y al usuario no le gustó. Tomar el patrón ya
validado de morficat da consistencia y una UX de gestión más clara.

## 3. Objetivos (en alcance)
- O1 — **Shell oscuro Tierra**: el layout de `/admin` fuerza el tema oscuro (independiente de
  claro/oscuro del sitio) usando los tokens `.dark`. Header con "Admin" en terracota,
  subtítulo con conteo, y "Cerrar sesión" a la derecha.
- O2 — **Lista de lugares** (`/admin/lugares`) estilo morficat: botones "+ Nuevo lugar"
  (terracota) y "Sugerencias" (outline, con badge de pendientes); tabla con columnas
  **Nombre** (nombre + slug debajo), **Categoría** (emoji + nombre), **Estado**
  (pill Activo/Borrador/Archivado + " · temporal/verificado"), **Acciones** ("Editar").
- O3 — **Formularios** crear/editar (`/admin/lugares/nuevo`, `/admin/lugares/[slug]/editar`)
  seccionados con headers en mayúsculas, inputs redondeados oscuros, grids de checkboxes para
  tipos de comida y atributos, editor de horarios por día, y toggles de estado
  (Activo/Publicado), botones "Crear/Guardar" y "Cancelar".
- O4 — **Pantalla de sugerencias** (`/admin/lugares` → "Sugerencias") que lista los venues
  `draft` provenientes del wizard, con sus datos y accesos para revisarlos (reusa el flujo de
  spec 025).
- O5 — Mantener intactas la lógica y las Server Actions existentes (solo cambia presentación).

## 4. No-objetivos (fuera de alcance, declarados)
- N1 — Cambiar el modelo de datos o las Server Actions de admin.
- N2 — Rediseñar el panel de **eventos** admin (se mantiene; puede heredar el shell oscuro).
- N3 — Nuevos campos de venue que no existan ya en el modelo.
- N4 — Reemplazar el flujo de sugerencias de spec 025 (se reusa; solo se le da entrada propia).
- N5 — Que el admin respete claro/oscuro del sitio (es siempre oscuro, como morficat).

## 5. Usuarios y permisos
Solo `admin` (el `AdminLayout` ya hace `getCurrentProfile` + `hasAtLeast("admin")`). Sin
cambios de permisos ni de RLS.

## 6. Comportamiento esperado
### Caso feliz
1. El admin entra a `/admin` (o `/admin/lugares`) y ve el panel oscuro Tierra.
2. La lista muestra los lugares con su estado; toca "Editar" para ir al form seccionado.
3. "Sugerencias (N)" lo lleva a revisar los drafts del wizard.
4. "+ Nuevo lugar" abre el form de creación.

### Edge cases
- Rol no admin → "Acceso denegado" (ya existente), también en estilo oscuro.
- Lista vacía → estado vacío coherente.
- Venue sin categoría → se muestra "— sin categoría —".

## 7. Contratos de módulo afectados
Ninguno en `core`/`auth`/`events`. Solo `web/app/admin/**` (presentación) + posibles
utilidades CSS en `globals.css`. Reusa Server Actions existentes
(`quickStatusAction`, `updateVenueAction`, `createVenueAction`, `approveSuggestedHoursAction`,
`geocodeVenueAction`, `logoutAction`).

Archivos afectados (restyle, sin cambiar lógica):
- `web/app/admin/layout.tsx` — shell oscuro.
- `web/app/admin/page.tsx` — dashboard oscuro (o simplificado).
- `web/app/admin/lugares/page.tsx` — lista estilo morficat + botón Sugerencias.
- `web/app/admin/lugares/nuevo/*` y `.../[slug]/editar/*` — forms seccionados.
- `web/app/admin/lugares/[slug]/page.tsx` — detalle (hereda shell).
- Nuevo: `web/app/admin/lugares/sugerencias/page.tsx` (o sección) para los drafts.

## 8. Criterios de aceptación
- AC1 — Todo `/admin` se ve en tema oscuro Tierra, con título terracota.
- AC2 — La lista de lugares replica el layout de morficat (Nombre+slug/Categoría/Estado/Editar).
- AC3 — Hay botón "Sugerencias" con badge de pendientes que lleva a los drafts.
- AC4 — Los forms están seccionados como morficat (BÁSICO, UBICACIÓN, … ESTADO).
- AC5 — La lógica de guardar/publicar/editar sigue funcionando igual.
- AC6 — `pnpm -r typecheck` pasa.

## 9. Riesgos y supuestos
- **Forzar oscuro:** envolver el contenido admin con la clase `.dark` hace cascar los tokens
  Tierra oscuros definidos en `globals.css` (`.dark { --bg… }`). Supuesto verificado: `.dark`
  es selector de clase (next-themes con `attribute="class"`).
- **Sin regresiones de datos:** al ser solo presentación, las Server Actions y RLS no cambian.
- Reusa el bucket de imágenes y el patrón de subida existente del form de edición.

## 10. Preguntas abiertas
_(ninguna — referencia visual capturada de morficat/admin.)_

## 11. Specs que esta feature evoluciona
- Rediseña la presentación introducida en **012 (admin venue detail)** y **017 (admin create
  venue)**; da entrada propia al flujo de **025 (revisión de sugerencias)**. No toca su lógica.
