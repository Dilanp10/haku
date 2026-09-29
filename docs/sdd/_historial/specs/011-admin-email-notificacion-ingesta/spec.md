# Feature Spec — Admin Email Notificacion Ingesta

> Documento de **qué** se construye y **por qué**. No describe cómo (eso va en
> `plan.md`). Léelo como contrato: cualquier ambigüedad acá se decide antes de planear.

## 1. Resumen
Al finalizar una corrida de ingesta de eventos (`/api/events/ingest`), si se
insertaron uno o más eventos nuevos, el sistema envía un email al administrador
informando la cantidad de eventos pendientes de moderación y un link directo a
`/admin/eventos`. Se usa el SDK oficial de Resend para el envío.

## 2. Motivación
Hoy el admin debe entrar manualmente a `/admin/eventos` para descubrir si llegaron
eventos nuevos. Esto hace que la moderación sea reactiva y lenta. Con una
notificación automática post-ingesta el ciclo se cierra: la ingesta corre (cron o
manual) → el admin recibe el email → modera desde el link. Sin esta feature,
eventos públicos valiosos pueden quedar semanas en estado `pending`.

## 3. Objetivos (en alcance)
- O1 — Al finalizar `POST /api/events/ingest`, si `summary.inserted > 0`, enviar
  un email al destinatario configurado en `ADMIN_EMAIL`.
- O2 — El email muestra: asunto con la cantidad de eventos nuevos, cuerpo con el
  detalle (fuente, cantidad insertada, cantidad actualizada) y un botón/link a
  `/admin/eventos`.
- O3 — El envío usa Resend SDK (`resend` npm package) con la API key en
  `RESEND_API_KEY`.
- O4 — Si el envío falla (red, API key inválida, etc.), el error se loggea pero
  NO interrumpe la respuesta de ingesta (el JSON de summary igual se retorna con
  200).
- O5 — Si `RESEND_API_KEY` o `ADMIN_EMAIL` no están configurados, el envío se
  omite silenciosamente (no lanza excepción).

## 4. No-objetivos (fuera de alcance, declarados)
- N1 — No enviar email cuando `inserted === 0` (solo actualizaciones, sin nuevos).
- N2 — No notificar sobre eventos rechazados ni publicados (solo ingesta nueva).
- N3 — No implementar template HTML complejo; texto plano o HTML mínimo es suficiente.
- N4 — No gestionar lista de destinatarios múltiples (un solo `ADMIN_EMAIL`).
- N5 — No reintentos automáticos de envío fallido.
- N6 — No guardar historial de emails enviados en DB.
- N7 — No notificar vía otros canales (Slack, SMS, etc.).

## 5. Usuarios y permisos
Esta feature no tiene superficie de usuario — es un efecto de servidor. El
destinatario del email es el admin configurado en `ADMIN_EMAIL`.

| Actor | Acción |
|---|---|
| Sistema (cron / llamada manual) | Dispara `POST /api/events/ingest` con token |
| Admin | Recibe email y entra a moderar |

## 6. Comportamiento esperado

### Caso feliz
1. Cron (o llamada manual con Bearer token válido) dispara `POST /api/events/ingest`.
2. La ingesta corre y devuelve `summary = { inserted: 3, updated: 1, ... }`.
3. Como `inserted > 0`, se llama a Resend con:
   - `from`: `"Haku <noreply@haku.app>"` (o el dominio configurado).
   - `to`: valor de `ADMIN_EMAIL`.
   - `subject`: `"[Haku] 3 eventos nuevos pendientes de moderación"`.
   - `html`: párrafo con el resumen y link a `/admin/eventos`.
4. Resend responde OK; el route handler retorna `200` con el summary.

### Caso: `inserted === 0`
La ingesta corre, no hay eventos nuevos. No se envía email. Route handler retorna
`200` con el summary como siempre.

### Caso: Resend falla
Resend lanza error (timeout, API key inválida, límite de rate). El error se imprime
con `console.error`. El route handler igual retorna `200` con el summary.

### Caso: vars no configuradas
`RESEND_API_KEY` o `ADMIN_EMAIL` están vacías/ausentes. El envío se omite. No hay
error ni log ruidoso (solo un `console.warn` opcional).

## 7. Contratos de módulo afectados
- `web/lib/email.ts` — nuevo helper `sendAdminIngestionAlert(summary, appUrl)`.
  Encapsula la llamada a Resend. No exporta desde ningún paquete de dominio.
- `web/app/api/events/ingest/route.ts` — al final del handler, llama
  `sendAdminIngestionAlert` si `summary.inserted > 0`.
- `web/lib/env.ts` — agregar `serverEnv.resendApiKey` y `serverEnv.adminEmail`.
- `.env.example` — documentar `RESEND_API_KEY` y `ADMIN_EMAIL`.
- `package.json` de `web/` — agregar dependencia `resend`.

No se modifica ningún módulo de dominio (`@haku/core`, `@haku/events`, `@haku/shared`).
La lógica de email vive exclusivamente en `web/` (composition root).

## 8. Criterios de aceptación
- AC1 — Con `RESEND_API_KEY` y `ADMIN_EMAIL` configurados, y `inserted > 0`, el
  admin recibe un email con el asunto correcto y el link a `/admin/eventos`.
- AC2 — Con `inserted === 0` no se envía email (verificable en logs de Resend).
- AC3 — Si Resend falla, el endpoint retorna `200` con el summary igual (no 500).
- AC4 — Sin `RESEND_API_KEY` o sin `ADMIN_EMAIL`, el endpoint funciona sin errores.
- AC5 — `pnpm -r typecheck` pasa sin errores.
- AC6 — `pnpm -r test` pasa sin errores (no hay tests nuevos de email; la lógica
  es glue code en el composition root).

## 9. Riesgos y supuestos
- **Supuesto**: el proyecto tiene un dominio verificado en Resend para el `from`.
  En desarrollo se puede usar el sandbox de Resend o el dominio `onboarding@resend.dev`.
- **Riesgo**: el `from` debe ser un dominio verificado en Resend o el envío falla.
  Mitigación: documentar en `.env.example` que `RESEND_FROM` es configurable, con
  default `onboarding@resend.dev` para desarrollo.
- **Riesgo**: Resend tiene rate limit en el plan gratuito (100 emails/día). Para un
  cron diario esto no es un problema.

## 10. Preguntas abiertas
Ninguna — el alcance es técnicamente cerrado.
