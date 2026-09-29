# Plan — Admin Email Notificacion Ingesta

> **Cómo** lo construimos. Escrito después de aprobar `spec.md`.

## 1. Arquitectura afectada
- **`@haku/web`** (composition root) — único módulo que cambia.
  - `web/lib/env.ts` — 2 vars nuevas en `serverEnv`.
  - `web/lib/email.ts` — nuevo helper de envío (nuevo archivo).
  - `web/app/api/events/ingest/route.ts` — llama al helper al final del handler.
  - `web/package.json` — nueva dep `resend`.
- **`.env.example`** — documentar las nuevas vars.

Frontera respetada: ningún módulo de dominio (`@haku/core`, `@haku/events`,
`@haku/shared`, `@haku/auth`) se toca. El email es glue code en `web/`.

Nueva dependencia justificada: `resend` es el SDK oficial de Resend (1 dep,
~20 kB, sin sub-deps pesadas). Alternativa `nodemailer` requeriría configurar
SMTP; Resend tiene API REST con SDK tipado, menos fricción operacional.

## 2. Modelo de datos
Sin migraciones. No se persiste nada en DB.

## 3. Diseño de ports y use-cases
No se agregan ports ni use-cases. La lógica de email es glue code de
infraestructura en `web/lib/` — no es lógica de negocio.

```ts
// web/lib/email.ts

interface IngestionSummary {
  fetched: number;
  inserted: number;
  updated: number;
  skipped: number;
  errors: string[];
}

async function sendAdminIngestionAlert(
  summary: IngestionSummary,
  appUrl: string,
): Promise<void>
// - Si !serverEnv.resendApiKey || !serverEnv.adminEmail → return (silencioso)
// - Construye subject: `[Haku] ${summary.inserted} evento(s) nuevo(s) pendiente(s)`
// - Construye html mínimo con el resumen y link a `${appUrl}/admin/eventos`
// - new Resend(apiKey).emails.send({ from, to, subject, html })
// - try/catch: console.error en fallo, nunca relanza
```

## 4. Diseño de infraestructura

### Variables de entorno (`web/lib/env.ts`)
```ts
serverEnv = {
  ...existing,
  resendApiKey:  process.env.RESEND_API_KEY,          // undefined si no está
  resendFrom:    process.env.RESEND_FROM ?? "onboarding@resend.dev",
  adminEmail:    process.env.ADMIN_EMAIL,              // undefined si no está
}
```

Ambas son opcionales (sin `required()`). Si faltan, el helper omite el envío.

### Helper `web/lib/email.ts`
```ts
import { Resend } from "resend";
import { serverEnv } from "./env.js";

export async function sendAdminIngestionAlert(
  summary: { inserted: number; updated: number; errors: string[] },
  appUrl: string,
): Promise<void> {
  if (!serverEnv.resendApiKey || !serverEnv.adminEmail) return;
  const resend = new Resend(serverEnv.resendApiKey);
  const subject = `[Haku] ${summary.inserted} evento(s) nuevo(s) pendiente(s) de moderación`;
  const html = `
    <p>La ingesta encontró <strong>${summary.inserted}</strong> evento(s) nuevo(s).</p>
    <p>Actualizados: ${summary.updated} | Errores: ${summary.errors.length}</p>
    <p><a href="${appUrl}/admin/eventos">Ir a moderar eventos →</a></p>
  `;
  try {
    await resend.emails.send({
      from: serverEnv.resendFrom,
      to: serverEnv.adminEmail,
      subject,
      html,
    });
  } catch (err) {
    console.error("[email] Error al enviar notificación de ingesta:", err);
  }
}
```

### Integración en el route handler (`route.ts`)
Al final del handler exitoso, después de actualizar `last_run_at`:

```ts
if (summary.inserted > 0) {
  await sendAdminIngestionAlert(summary, env.appUrl);
}
return NextResponse.json(summary, { status: 200 });
```

`env.appUrl` ya existe en `web/lib/env.ts` como `env.appUrl`.

## 5. UI / Server Actions / route handlers (`web`)
No hay UI nueva. El único cambio de route handler es añadir la llamada al helper.
No hay nueva ruta, no hay Server Action, no hay revalidación de ISR.

## 6. Estrategia de tests
No se agregan tests automatizados (la lógica es glue code: instanciar Resend +
condicional). Los criterios AC3 y AC4 se verifican manualmente:

- AC3: setear una API key inválida y llamar al endpoint → retorna 200.
- AC4: dejar las vars vacías → retorna 200 igual.
- AC1/AC2: verificar en el dashboard de Resend que llega / no llega el email.

`pnpm -r test` (unitarios) no toca este código → sigue en verde sin cambios.

## 7. Riesgos del plan
- **`from` no verificado en Resend**: en prod hay que verificar el dominio. En dev
  usar `onboarding@resend.dev` (Resend lo permite para test). El `RESEND_FROM` env
  var permite cambiarlo sin tocar código.
- **`env.appUrl` en producción**: `NEXT_PUBLIC_APP_URL` debe estar seteado a la URL
  real para que el link del email sea correcto. Ya está documentado en `.env.example`.
- **Timeout de Resend en el request**: el `await` del envío añade latencia al
  response del endpoint de ingesta. Dado que el endpoint es llamado por un cron
  (no un usuario), es aceptable. Si fuera un problema, se puede hacer fire-and-forget
  con `void sendAdminIngestionAlert(...)` (sin await).

## 8. Orden de implementación
```
1. Instalar dep `resend` en web/package.json
2. Agregar resendApiKey, resendFrom, adminEmail a web/lib/env.ts
3. Crear web/lib/email.ts con sendAdminIngestionAlert
4. Integrar en web/app/api/events/ingest/route.ts
5. Documentar vars en .env.example
```

Sin dependencias entre 1 y 5 salvo que 3 requiere 2, y 4 requiere 3.
