# Plan -- Push Notifications

## 1. Arquitectura afectada
- `@haku/web` -- service worker, push utils, Server Actions, client component.
- `@haku/shared` -- sin cambios (PushSubscriptionData es interno a web).
- `@haku/events` -- sin cambios. El envio de push se hace desde web post-usecase.
- `@haku/core`, `@haku/auth` -- sin cambios.
- Frontera respetada: push es infraestructura de web, no logica de dominio.
- Dependencia npm nueva: `web-push` (justificacion: es la unica lib estable para
  enviar Web Push desde Node.js, usada por >90% de implementaciones. ~50KB).

## 2. Modelo de datos

### Migracion `supabase/migrations/0011_push_subscriptions.sql`
```sql
create table push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  endpoint text not null unique,
  keys_p256dh text not null,
  keys_auth text not null,
  user_id uuid references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

-- RLS: insert abierto (visitors sin auth pueden suscribirse).
-- Select/delete: solo service_role (servidor).
alter table push_subscriptions enable row level security;
create policy "Anyone can subscribe" on push_subscriptions
  for insert with check (true);
create policy "Users can delete own" on push_subscriptions
  for delete using (user_id = auth.uid());
```

user_id es nullable -- visitors anonimos pueden suscribirse.
Solo service_role lee todas las suscripciones para enviar.

## 3. Diseno de ports y use-cases

No hay use-cases de dominio nuevos. La logica es infraestructura de web:

```ts
// web/lib/push/send-notifications.ts
async function sendNewEventNotifications(events: { title: string; slug: string }[]): Promise<void>
  // 1. Lee todas las suscripciones de push_subscriptions con adminClient
  // 2. Para cada suscripcion, envia push con web-push
  // 3. Si endpoint retorna 410, elimina la suscripcion
  // 4. Log errores pero no falla (fire-and-forget)

// web/lib/push/vapid.ts
function getVapidKeys(): { publicKey: string; privateKey: string; subject: string }
  // Lee de env vars: VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, VAPID_SUBJECT
```

## 4. Diseno de infraestructura
- `web-push` se configura con VAPID keys al inicio de cada envio.
- Las suscripciones se leen/escriben directamente con Supabase client (no hay
  port porque no es logica de dominio, es infra de notificaciones).
- El service worker es un archivo estatico en `web/public/sw.js`.

## 5. UI / Server Actions / route handlers

### Server Actions
- `subscribeAction(formData)` -- guarda PushSubscription en DB.
  Recibe endpoint, p256dh, auth como campos hidden.
  No requiere auth (visitors pueden suscribirse). Usa `createAdminSupabase()`
  para insert (RLS permite insert pero usamos admin para consistencia).
- `unsubscribeAction(formData)` -- elimina por endpoint.

### Client component
- `web/components/push-subscribe-btn.tsx`:
  - Feature detection: `'serviceWorker' in navigator && 'PushManager' in window`.
  - Registra SW, pide permiso, obtiene PushSubscription con applicationServerKey.
  - Llama subscribeAction con los datos.
  - Estado: idle / subscribed / denied / unsupported.

### Service Worker
- `web/public/sw.js`:
  - `push` event: parsea payload JSON, muestra notificacion con `self.registration.showNotification`.
  - `notificationclick` event: abre URL del evento con `clients.openWindow`.

### Integracion con ingesta/creacion
- `triggerIngestionAction` en `web/app/admin/eventos/actions.ts`:
  despues del ingestion, si `summary.inserted > 0`, llamar
  `sendNewEventNotifications` con los eventos nuevos.
- `createEventAction` en `web/app/admin/eventos/nuevo/actions.ts`:
  despues de crear, si status es "published", llamar `sendNewEventNotifications`.

### Env vars
- `NEXT_PUBLIC_VAPID_PUBLIC_KEY` -- expuesta al client para PushManager.subscribe().
- `VAPID_PRIVATE_KEY` -- solo servidor.
- `VAPID_SUBJECT` -- email del operador, ej: `mailto:admin@haku.app`.

## 6. Estrategia de tests
- Unit: `send-notifications.test.ts` con mock de web-push y mock de Supabase.
  - Caso feliz: llama sendNotification N veces.
  - Endpoint 410: elimina suscripcion.
  - Sin suscriptores: no falla.
- El service worker y el boton se testean manualmente en browser.

## 7. Riesgos del plan
- Si VAPID keys se pierden, todas las suscripciones existentes se invalidan.
  Mitigacion: documentar en deploy/README que VAPID keys son permanentes.
- Web Push en Safari iOS requiere iOS 16.4+. Mitigacion: feature detection
  oculta el boton si no hay soporte.
- Rate limiting de push endpoints (Chrome limita ~100 push/min por origen).
  Mitigacion: para MVP con <100 suscriptores es irrelevante.

## 8. Orden de implementacion
1. T1: Instalar `web-push` + generar VAPID keys helper.
2. T2: Migracion `0011_push_subscriptions.sql`.
3. T3: `send-notifications.ts` + test unitario.
4. T4: Server Actions subscribe/unsubscribe.
5. T5: Service worker `sw.js`.
6. T6: Client component `PushSubscribeBtn`.
7. T7: Integrar envio en `triggerIngestionAction` y `createEventAction`.
8. T8: Agregar VAPID vars a `deploy/k8s/secret.example.yaml` + README.
9. T9: Gate final typecheck + test.
