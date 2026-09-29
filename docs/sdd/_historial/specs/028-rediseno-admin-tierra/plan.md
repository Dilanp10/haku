# Plan — Rediseño del panel admin (Tierra oscuro)

> **Cómo** lo construimos. Solo presentación en `web/app/admin/**`.

## 1. Arquitectura afectada
Solo `web/`. Reusa Server Actions y `getCurrentProfile`/`requireProfile`. Sin cambios en
`core`/`auth`/`events`/`shared`. Sin dependencias nuevas.

## 2. Modelo de datos
Sin cambios.

## 3. Diseño de dominio, ports y use-cases
Ninguno. Reusa lo existente.

## 4. Diseño de infraestructura
El shell fuerza tema oscuro envolviendo el contenido en `<div className="dark …">` con
`background: var(--bg); color: var(--fg)` — los tokens Tierra oscuros de `.dark` cascan.

## 5. UI / Server Actions (`web`)

### Tokens y estilo (morficat)
- Fondo `var(--bg)` (marrón muy oscuro), texto `var(--fg)`.
- Títulos de página en `var(--terra)` (terracota), serif `.text-brand`.
- Section headers: mayúsculas, `letter-spacing`, `var(--fg-50)`.
- Inputs: `rounded-[10px]`, `background: var(--card-bg)`, `border: 1px var(--line-2)`,
  foco con anillo terracota; labels arriba, obligatorios con `*` terracota.
- Botón primario: `background: var(--terra)`, texto blanco, `rounded-[10px]`.
- Botón secundario: outline `var(--line-2)`.
- Pills de estado: Activo/Publicado → `var(--moss)`; Borrador → neutro; Archivado → `var(--rust)`.

### `layout.tsx`
Header: "Volver a Haku" (o link al sitio) + branding; cuerpo en `.dark`. Mantiene la guarda
de rol. El "Cerrar sesión" (form → `logoutAction`) arriba a la derecha.

### `admin/lugares/page.tsx` (lista, foco principal)
- Header: "Admin"/"Lugares" terracota + "N lugares cargados".
- Acciones: "+ Nuevo lugar" (terracota) y "Sugerencias" (outline + badge de drafts).
- Tabla: filas con Nombre (bold) + slug (mono, `var(--fg-50)`), Categoría (emoji+nombre),
  Estado (pill + " · " estado secundario), "Editar" (terracota, a la derecha).
- `divide-y` con `var(--line)`.

### Forms `nuevo` / `editar`
Reutilizar los form components existentes (`new-venue-form.tsx`, `edit-venue-form.tsx`)
cambiando solo clases → estilo oscuro seccionado. Secciones: BÁSICO, UBICACIÓN, CONTACTO,
IMAGEN, TIPOS DE COMIDA (grid checkboxes), ATRIBUTOS (grid checkboxes), HORARIOS (7 días),
ESTADO (toggles). Botones "Crear/Guardar lugar" + "Cancelar".

### Sugerencias
Nueva ruta/sección que lista venues `draft` (los del wizard) con Nombre/Tipo/Dónde/fecha y
link a su detalle admin (donde ya está el panel de spec 025). Badge en la lista = count de drafts.

### Dashboard `admin/page.tsx`
Restyle oscuro de las StatCards/ActionCards (o simplificar). Mantiene stats.

## 6. Estrategia de tests
Sin lógica nueva. Gate: `pnpm -r typecheck` + build + verificación visual comparando con
morficat/admin. Deploy.

## 7. Riesgos del plan
| Riesgo | Mitigación |
|---|---|
| Clases shadcn (`bg-card`, `text-primary`) mezcladas | Reemplazar por `var()` inline como en el sitio público |
| Forzar `.dark` no cascar | Verificado: `.dark` es selector de clase en globals |
| Regresión funcional al restyle | No tocar lógica ni nombres de campos del form; solo clases/markup |

## 8. Orden de implementación
```
T1 [B] layout.tsx: shell oscuro Tierra
T2 [B] admin/lugares/page.tsx: lista estilo morficat + botón Sugerencias
T3 [P] admin/lugares/sugerencias: lista de drafts
T4 [P] admin/page.tsx: dashboard oscuro
T5 [B] new-venue-form.tsx + edit-venue-form.tsx: forms seccionados oscuros
T6 [B] admin/lugares/[slug]/page.tsx + editar/page.tsx: heredar estilo
T7 [B] typecheck + build + deploy + verificación
```
