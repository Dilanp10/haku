import { Resend } from "resend";
import type { IngestionSummary } from "@haku/events";
import { serverEnv } from "./env";

export async function sendAdminIngestionAlert(
  summary: IngestionSummary,
  appUrl: string,
): Promise<void> {
  if (!serverEnv.resendApiKey || !serverEnv.adminEmail) return;

  const resend = new Resend(serverEnv.resendApiKey);
  const subject = `[Haku] ${summary.inserted} evento(s) nuevo(s) pendiente(s) de moderación`;
  const html = `
    <p>La ingesta encontró <strong>${summary.inserted}</strong> evento(s) nuevo(s) pendiente(s) de moderación.</p>
    <p>Actualizados: ${summary.updated} | Errores: ${summary.errors.length > 0 ? summary.errors.map((e) => e.sourceKey).join(", ") : "ninguno"}</p>
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
