# Feature Spec -- Push Notifications

## 1. Resumen
Notificaciones push via Web Push API para avisar a usuarios cuando se publican
eventos nuevos. El usuario opta-in desde la UI, se registra un service worker,
y el backend envia notificaciones despues de cada ingesta o creacion manual de evento.

## 2. Motivacion
Los usuarios de Catamarca no tienen forma de enterarse de eventos nuevos sin abrir
la app. Push notifications resuelven esto con un canal directo y sin friccion
(no requiere cuenta de email ni app nativa).

## 3. Objetivos (en alcance)
- O1 -- Boton "Activar notificaciones" en la UI publica que registra la suscripcion
  Web Push del navegador.
- O2 -- Tabla `push_subscriptions` en Supabase para persistir suscripciones.
- O3 -- Service worker que recibe push events y muestra la notificacion nativa.
- O4 -- Funcion servidor `sendNewEventNotifications` que envia notificaciones a
  todos los suscriptores cuando se publican eventos nuevos.
- O5 -- Integrar el envio al final de la ingesta y al crear evento manual.

## 4. No-objetivos (fuera de alcance, declarados)
- N1 -- Notificaciones por email (futuro).
- N2 -- Notificaciones por ubicacion/cercanias (requiere geolocalizacion persistida
  del usuario; futuro).
- N3 -- Preferencias granulares (por categoria, por frecuencia). MVP: todo o nada.
- N4 -- App nativa / PWA install prompt (futuro).

## 5. Usuarios y permisos
| Rol | Lo que puede hacer |
|---|---|
| visitor | Suscribirse/desuscribirse a notificaciones push. |
| editor  | Idem visitor. |
| admin   | Idem visitor + las notificaciones se envian automaticamente al publicar. |

## 6. Comportamiento esperado

### Caso feliz -- suscripcion
1. Usuario visita la app en un navegador compatible (Chrome, Firefox, Edge).
2. Ve un boton/icono "Activar notificaciones" en el header o footer.
3. Al hacer clic, el browser pide permiso para notificaciones.
4. Si acepta, se registra el service worker, se obtiene el PushSubscription,
   y se guarda en `push_subscriptions` via Server Action.
5. El boton cambia a "Notificaciones activas" (con opcion de desactivar).

### Caso feliz -- envio
1. Admin ejecuta ingesta o crea evento manual.
2. Si hay eventos nuevos publicados, el servidor lee todas las suscripciones
   activas y envia un push por cada una con web-push (npm).
3. El service worker recibe el evento push, muestra notificacion nativa con
   titulo del evento y link a `/eventos/[slug]`.
4. Al hacer clic en la notificacion, se abre la pagina del evento.

### Edge cases
- **Navegador no soporta push**: el boton no se muestra (feature detection).
- **Usuario deniega permiso**: mostrar mensaje "Permiso denegado" y ocultar boton.
- **Suscripcion expira o endpoint invalido**: al enviar push, si el endpoint
  retorna 410 Gone, eliminar la suscripcion de la DB.
- **Sin suscriptores**: el envio no falla, simplemente no envia nada.

### Errores visibles
- "Tu navegador no soporta notificaciones push."
- "Permiso denegado. Activa las notificaciones desde la configuracion del navegador."
- "Error al activar notificaciones. Intenta de nuevo."

## 7. Contratos de modulo afectados

### `@haku/shared`
- Nuevo tipo `PushSubscriptionData`: `{ endpoint: string; keys: { p256dh: string; auth: string } }`

### `@haku/events`
- Sin cambios en el dominio ni ports.
- El envio de notificaciones se hace desde `web` despues de llamar al use-case,
  no dentro del use-case (mantiene dominio puro).

### `web`
- `web/public/sw.js` -- Service worker que maneja push events.
- `web/lib/push/vapid.ts` -- Genera/lee VAPID keys desde env vars.
- `web/lib/push/send-notifications.ts` -- Funcion servidor que envia push
  a todos los suscriptores usando `web-push` (npm).
- `web/app/api/push/subscribe/route.ts` -- POST para guardar suscripcion.
  ? O alternativamente un Server Action.
- `web/components/push-subscribe-btn.tsx` -- Client component.

### Supabase
- Nueva migracion `0011_push_subscriptions.sql`:
  ```sql
  create table push_subscriptions (
    id uuid primary key default gen_random_uuid(),
    endpoint text not null unique,
    keys_p256dh text not null,
    keys_auth text not null,
    user_id uuid references auth.users(id) on delete cascade,
    created_at timestamptz not null default now()
  );
  ```
- RLS: cualquiera puede insertar su propia suscripcion (o sin auth para visitors).
  Solo `service_role` puede leer todas para enviar.

### Env vars nuevas
- `VAPID_PUBLIC_KEY` -- clave publica VAPID (se expone al client).
- `VAPID_PRIVATE_KEY` -- clave privada VAPID (solo servidor).
- `VAPID_SUBJECT` -- email o URL del operador (requerido por Web Push).

### Dependencias npm nuevas
- `web-push` -- libreria para enviar Web Push notifications desde Node.js.

## 8. Criterios de aceptacion
- AC1 -- El boton "Activar notificaciones" aparece solo en navegadores compatibles.
- AC2 -- Al aceptar, la suscripcion se guarda en `push_subscriptions`.
- AC3 -- Al crear un evento manual publicado, los suscriptores reciben una push.
- AC4 -- Al hacer clic en la notificacion, se abre `/eventos/[slug]`.
- AC5 -- Suscripciones con endpoint invalido (410) se eliminan automaticamente.
- AC6 -- `pnpm -r typecheck` y `pnpm -r test` pasan.
- AC7 -- Sin fugas de VAPID_PRIVATE_KEY al client.

## 9. Riesgos y supuestos
- Supuesto: la mayoria de usuarios en Catamarca usa Chrome mobile, que soporta
  Web Push. Safari iOS lo soporta desde iOS 16.4+ (2023).
- Riesgo: si hay muchos suscriptores (>1000), el envio secuencial es lento.
  Mitigacion: para MVP es aceptable; en futuro, usar cola/batch.
- Riesgo: VAPID keys deben generarse una vez y persistirse. Si se pierden, todas
  las suscripciones existentes se invalidan.

## 10. Preguntas abiertas
Ninguna. Decidido: Server Action para suscripcion (consistente con el resto).
