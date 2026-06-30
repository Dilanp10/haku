# Feature Spec — Admin Venue Detail Preview

> Documento de **qué** se construye y **por qué**. No describe cómo (eso va en
> `plan.md`). Léelo como contrato: cualquier ambigüedad acá se decide antes de planear.

## 1. Resumen
Agregar la ruta `/admin/lugares/[slug]` que muestra el detalle completo de un venue
tal como lo verá el público (cover image, descripción, food types, mapa, contacto),
más una barra de acciones admin en la parte superior (Editar, cambio de status,
link a la página pública). Solo accesible para rol `admin`. RSC dinámico (sin ISR).

## 2. Motivación
Hoy el admin puede editar un venue pero no tiene forma directa de ver el resultado
final sin abandonar el panel y navegar a `/lugares/[slug]` — que además solo muestra
venues `published`. Para borradores o archivados, el preview no existe en ningún
lado. Esta página cierra ese hueco: el admin ve exactamente qué va a publicar antes
de hacerlo, y puede actuar desde la misma pantalla.

## 3. Objetivos (en alcance)
- O1 — Ruta `/admin/lugares/[slug]` RSC dinámica, protegida con `requireProfile('admin')`.
- O2 — Muestra el venue con el mismo layout visual que la página pública de detalle:
  cover image, nombre, dirección, descripción, food types, mapa, contacto (tel/web/ig).
- O3 — Barra de acciones admin encima del contenido:
  - Botón "← Volver" a `/admin/lugares`.
  - Badge de estado del venue (Borrador / Publicado / Archivado).
  - Botón "Editar" → `/admin/lugares/[slug]/editar`.
  - `QuickStatusBtn` reutilizado desde `admin/lugares/` (Publicar / Archivar / Reactivar).
  - Link "Ver página pública" → `/lugares/[slug]` (solo si status === 'published').
- O4 — La lista `/admin/lugares` agrega un link "Ver detalle" en cada fila que
  apunta a `/admin/lugares/[slug]`.
- O5 — Funciona para venues en cualquier status (draft, published, archived).

## 4. No-objetivos (fuera de alcance, declarados)
- N1 — No reemplazar la página pública `/lugares/[slug]`; son dos rutas distintas.
- N2 — No agregar formulario de edición inline; "Editar" redirige a la ruta existente.
- N3 — No implementar comentarios ni historial de cambios.
- N4 — No mostrar métricas de visitas (eso es un feature futuro de analytics).

## 5. Usuarios y permisos
| Rol | Acceso |
|---|---|
| visitor | Sin acceso (redirige a login por middleware) |
| editor | Sin acceso (`requireProfile('admin')` rechaza) |
| admin | Acceso completo; puede cambiar status y navegar al editor |

## 6. Comportamiento esperado

### Caso feliz
1. Admin navega a `/admin/lugares` y hace clic en "Ver detalle" de un venue.
2. Carga `/admin/lugares/[slug]` con el venue completo.
3. Ve la barra de acciones: badge de status, botón Editar, QuickStatusBtn, y
   (si published) link a la página pública.
4. El contenido debajo es idéntico visualmente al detalle público.

### Venue no encontrado
Si el slug no existe en DB, `notFound()` → Next.js renderiza la página 404.

### Venue draft/archived
Se muestra igual que published, sin restricción de RLS porque el admin usa el
client con la anon key pero `requireProfile('admin')` ya garantiza que es admin.
(La RLS de venues solo filtra para la anon key en las rutas públicas; la sesión
autenticada del admin puede leer cualquier venue de su propio perfil — o usamos
el mismo `createServerSupabase()` que ya existe en las rutas de admin).

## 7. Contratos de módulo afectados
- `web/app/admin/lugares/[slug]/page.tsx` — nuevo RSC, `dynamic = "force-dynamic"`.
  Reutiliza `getVenueBySlug`, `listFoodTypes`, `createSupabaseCoreRepository`.
  Reutiliza `QuickStatusBtn` y `quickStatusAction` de `admin/lugares/`.
- `web/app/admin/lugares/page.tsx` — agrega link "Ver detalle" (`/admin/lugares/[slug]`)
  en cada fila de la tabla, junto a los botones existentes.
- `web/components/venue-map.tsx` — se reutiliza sin cambios.

No se modifica ningún port, use-case, adapter ni migración.
No se agrega ninguna dependencia npm nueva.

## 8. Criterios de aceptación
- AC1 — `/admin/lugares/[slug]` carga correctamente para un venue `draft`.
- AC2 — `/admin/lugares/[slug]` carga correctamente para un venue `published`.
- AC3 — `/admin/lugares/[slug]` con slug inexistente devuelve 404.
- AC4 — Sin sesión de admin, la ruta redirige al login.
- AC5 — El botón "Editar" lleva a `/admin/lugares/[slug]/editar`.
- AC6 — `QuickStatusBtn` cambia el status y recarga la página (revalida).
- AC7 — El link "Ver página pública" solo aparece cuando `status === 'published'`.
- AC8 — La lista `/admin/lugares` tiene el link "Ver detalle" en cada fila.
- AC9 — `pnpm -r typecheck` y `pnpm -r test` pasan sin errores.

## 9. Riesgos y supuestos
- **Supuesto**: `createServerSupabase()` con la sesión del admin puede leer venues
  en cualquier status. Verificar que la RLS de `venues` permite SELECT al usuario
  autenticado sin restricción de status (actualmente la política pública filtra por
  `status = 'published'` para anon; el admin autenticado puede ver todo).
- **Riesgo**: Si la RLS solo permite leer venues published incluso para usuarios
  autenticados no-service-role, habrá que usar `createAdminSupabase()` en esta
  página. Mitigación: verificar la migración de RLS antes de implementar.

## 10. Preguntas abiertas
Ninguna — el alcance es técnicamente cerrado.
