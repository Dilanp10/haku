# Tasks — Admin Email Notificacion Ingesta

> Lista accionable derivada de `plan.md`. Cada tarea: pequeña, testeable, con un
> "hecho" sin ambigüedad. Marcar `[x]` al completar.

## Convenciones
- `T1`, `T2`, ... — orden recomendado.
- `[P]` tarea paralelizable.
- `[B]` bloqueante para otras.

## Tareas

- [x] T1 [B] — Instalar `resend` en `web/`: `pnpm --filter @haku/web add resend`. Verificar que aparece en `web/package.json` dependencies.

- [x] T2 [B] — Agregar a `serverEnv` en `web/lib/env.ts`:
  - `resendApiKey: process.env.RESEND_API_KEY` (opcional, sin `required()`).
  - `resendFrom: process.env.RESEND_FROM ?? "onboarding@resend.dev"`.
  - `adminEmail: process.env.ADMIN_EMAIL` (opcional).

- [x] T3 [B] — Crear `web/lib/email.ts` con la función `sendAdminIngestionAlert(summary, appUrl)`:
  - Guard: si `!serverEnv.resendApiKey || !serverEnv.adminEmail` → return.
  - Subject: `[Haku] N evento(s) nuevo(s) pendiente(s) de moderación`.
  - HTML mínimo: inserted, updated, errores y link a `${appUrl}/admin/eventos`.
  - `try/catch`: `console.error` en fallo, nunca relanza.

- [x] T4 [B] — Integrar en `web/app/api/events/ingest/route.ts`: después de actualizar `last_run_at` y antes del `return NextResponse.json(summary)`, agregar:
  ```ts
  if (summary.inserted > 0) {
    await sendAdminIngestionAlert(summary, env.appUrl);
  }
  ```

- [x] T5 [P] — Documentar en `.env.example` (sección nueva `# Email / Resend`):
  - `RESEND_API_KEY=re_...`
  - `RESEND_FROM=onboarding@resend.dev`
  - `ADMIN_EMAIL=tu@email.com`
  - Nota: si no se configuran, las notificaciones se omiten silenciosamente.

## Verificación final (definition of done)
- [ ] `pnpm -r typecheck` pasa sin errores.
- [ ] `pnpm -r test` pasa sin errores.
- [ ] AC3 verificado: con `RESEND_API_KEY=invalida`, el endpoint retorna `200`.
- [ ] AC4 verificado: sin vars de email, el endpoint retorna `200`.
- [ ] `.env.example` tiene las 3 vars documentadas.
- [ ] `BACKLOG.md` actualizado con la Fase 23.
