# Tasks -- Push Notifications

> Lista accionable derivada de `plan.md`. Cada tarea: pequena, testeable, con un
> "hecho" sin ambiguedad. Marcar `[x]` al completar.

## Convenciones
- `T1`, `T2`, ... -- orden recomendado.
- `[P]` tarea paralelizable.
- `[B]` bloqueante para otras.

## Tareas

- [x] T1 [B] -- Instalar `web-push` como dependencia de `web/`. Crear
  `web/lib/push/vapid.ts` que exporta `getVapidKeys()` leyendo de env vars
  `NEXT_PUBLIC_VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT`. Agregar
  las tres vars a `web/lib/env.ts` (o equivalente). Agregar tipos:
  `pnpm -F web add web-push && pnpm -F web add -D @types/web-push`.
  **Hecho cuando**: `pnpm -r typecheck` pasa con el nuevo modulo importable.

- [x] T2 [P] -- Crear migracion `supabase/migrations/0011_push_subscriptions.sql`.
  Tabla: `id uuid PK default gen_random_uuid()`, `endpoint text not null unique`,
  `keys_p256dh text not null`, `keys_auth text not null`,
  `user_id uuid references auth.users(id) on delete cascade` (nullable),
  `created_at timestamptz not null default now()`. RLS activada: policy insert
  abierta (`with check (true)`), policy delete propia (`using (user_id = auth.uid())`).
  **Hecho cuando**: archivo SQL valido creado.

- [x] T3 [B] -- Crear `web/lib/push/send-notifications.ts`. Funcion
  `sendNewEventNotifications(events: { title: string; slug: string }[])`.
  Lee suscripciones de `push_subscriptions` con `createAdminSupabase()`, envia
  push con `web-push.sendNotification()` a cada una. Si endpoint retorna 410,
  elimina la suscripcion. Payload JSON: `{ title, body, url }`. Incluir test
  unitario `send-notifications.test.ts` con mock de web-push: caso feliz
  (N llamadas), endpoint 410 (elimina), sin suscriptores (no falla).
  **Hecho cuando**: test pasa con `pnpm -F web test`.

- [x] T4 [P] -- Crear Server Actions `subscribePushAction` y `unsubscribePushAction`
  en `web/lib/push/actions.ts`. Subscribe recibe endpoint, p256dh, auth desde
  FormData, inserta en `push_subscriptions` con `createAdminSupabase()`.
  Unsubscribe recibe endpoint, elimina el row.
  **Hecho cuando**: `pnpm -r typecheck` pasa.

- [x] T5 [P] -- Crear service worker `web/public/sw.js`. Listener `push`:
  parsea payload JSON, llama `self.registration.showNotification(data.title,
  { body: data.body, data: { url: data.url } })`. Listener `notificationclick`:
  `clients.openWindow(event.notification.data.url)`.
  **Hecho cuando**: archivo creado, sintaxis JS valida.

- [x] T6 [B] -- Crear client component `web/components/push-subscribe-btn.tsx`.
  Feature detection (`'serviceWorker' in navigator && 'PushManager' in window`).
  Registra SW, llama `pushManager.subscribe({ userVisibleOnly: true,
  applicationServerKey })`, envia datos a `subscribePushAction`. Estados:
  unsupported / idle / subscribed / denied. Boton toggle: "Activar notificaciones"
  / "Notificaciones activas (desactivar)".
  **Hecho cuando**: `pnpm -r typecheck` pasa.

- [x] T7 [P] -- Montar `PushSubscribeBtn` en el layout o header del sitio publico.
  **Hecho cuando**: el componente aparece en la UI.

- [x] T8 [B] -- Integrar envio de notificaciones: en `triggerIngestionAction`
  (web/app/admin/eventos/actions.ts), si `summary.inserted > 0`, llamar
  `sendNewEventNotifications`. En `createEventAction`
  (web/app/admin/eventos/nuevo/actions.ts), si el evento se creo con status
  "published", llamar `sendNewEventNotifications`.
  **Hecho cuando**: `pnpm -r typecheck` pasa.

- [x] T9 [P] -- Agregar VAPID env vars a `deploy/k8s/secret.example.yaml` y
  documentar en `deploy/README.md` como generar VAPID keys con
  `npx web-push generate-vapid-keys`.
  **Hecho cuando**: ambos archivos actualizados.

- [x] T10 -- Gate final: `pnpm -r typecheck` + `pnpm -r test` pasan.
  **Hecho cuando**: 0 errores en ambos comandos.

## Verificacion final (definition of done)
- [x] `pnpm -r typecheck` pasa.
- [x] `pnpm -r test` pasa.
- [x] AC1-AC7 del spec verificados.
- [x] Migracion nueva `0011_push_subscriptions.sql` creada.
- [x] VAPID keys documentadas en deploy/README.
