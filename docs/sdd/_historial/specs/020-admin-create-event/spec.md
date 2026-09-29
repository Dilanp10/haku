# Feature Spec -- Admin Create Event

## 1. Resumen
Formulario en `/admin/eventos/nuevo` para que un admin cree eventos manualmente,
sin depender del scraper ni la ingesta automatica. Replica el patron existente de
`/admin/lugares/nuevo`.

## 2. Motivacion
Actualmente la unica forma de agregar eventos es la ingesta automatica (scraper/demo).
Si el admin se entera de un evento por otro canal (redes sociales, boca a boca, flyer)
no tiene forma de cargarlo en la app sin tocar la base de datos.

## 3. Objetivos (en alcance)
- O1 -- Pagina `/admin/eventos/nuevo` con formulario completo.
- O2 -- Server Action `createEventAction` que valide con Zod e inserte el evento.
- O3 -- El evento creado queda en estado `published` por defecto (el admin lo crea
  a proposito, no necesita moderacion).
- O4 -- Use-case puro `createEvent` en `@haku/events` con validacion de dominio.

## 4. No-objetivos (fuera de alcance, declarados)
- N1 -- Subida de imagen de portada (se agrega despues).
- N2 -- Edicion de evento existente desde el admin (ya existe `updateEvent`).
- N3 -- Creacion de eventos por usuarios no-admin.
- N4 -- Geolocalizacion en mapa para elegir coordenadas.

## 5. Usuarios y permisos
| Rol | Lo que puede hacer |
|---|---|
| visitor | Nada. No ve la ruta. |
| editor  | Nada. No tiene acceso a admin. |
| admin   | Crear eventos manuales via formulario. |

## 6. Comportamiento esperado

### Caso feliz
1. Admin navega a `/admin/eventos` y hace clic en "Nuevo evento".
2. Se abre `/admin/eventos/nuevo` con formulario: titulo (requerido), descripcion,
   fecha inicio (requerido), fecha fin, lugar, direccion, URL, categoria, estado.
3. Admin llena los campos y hace clic en "Crear evento".
4. Server Action valida con Zod, crea slug + dedupeHash, inserta en DB.
5. Redirige a `/admin/eventos` con revalidacion de cache.

### Edge cases
- **Titulo vacio o fecha vacia**: error de validacion inline.
- **Titulo duplicado con misma fecha**: se permite (dedupeHash usa sourceKey="manual"
  + titulo + fecha, asi que solo colisiona si son identicos).
- **Sin permisos**: `requireProfile("admin")` redirige al login.

### Errores visibles
- "El titulo es obligatorio."
- "La fecha de inicio es obligatoria."
- "Error inesperado al crear el evento."

## 7. Contratos de modulo afectados

### `@haku/events`
- Nuevo use-case: `createEvent(repo: EventRepository, input: CreateEventInput): Promise<Result<Event>>`
- `CreateEventInput`: `{ title: string; description?: string; startsAt: string; endsAt?: string; venueName?: string; address?: string; url?: string; category?: string; status?: EventStatus }`
- El use-case llama a `normalize()` con `sourceKey: "manual"` y luego `repo.upsertMany([normalized])`.
- Nuevo export en `index.ts`.

### `@haku/events` -- EventRepository
- Sin cambios. `upsertMany` ya soporta insertar un solo evento.

### `web`
- `web/app/admin/eventos/nuevo/page.tsx` -- RSC con `force-dynamic`, `requireProfile("admin")`.
- `web/app/admin/eventos/nuevo/actions.ts` -- Server Action `createEventAction`.
- `web/app/admin/eventos/nuevo/new-event-form.tsx` -- Client component con `useActionState`.
- Boton "Nuevo evento" en `web/app/admin/eventos/page.tsx`.

### Supabase
- Sin migraciones. La tabla `events` ya existe con todos los campos necesarios.

## 8. Criterios de aceptacion
- AC1 -- Admin puede navegar a `/admin/eventos/nuevo` y ver el formulario.
- AC2 -- Al enviar el formulario con datos validos, el evento aparece en la lista admin.
- AC3 -- Al enviar sin titulo o sin fecha, se muestra error de validacion.
- AC4 -- El evento creado tiene `sourceKey: "manual"`, slug generado, y estado `published`.
- AC5 -- Visitor/editor no puede acceder a la ruta.
- AC6 -- `pnpm -r typecheck` y `pnpm -r test` pasan.

## 9. Riesgos y supuestos
- Supuesto: `upsertMany` con array de 1 elemento funciona correctamente para insert.
- Riesgo: colision de dedupeHash si el admin crea dos eventos con el mismo titulo y fecha.
  Mitigacion: en ese caso upsert actualiza el existente (comportamiento aceptable).

## 10. Preguntas abiertas
Ninguna. Todo decidido.
