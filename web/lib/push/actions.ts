"use server";

import { createAdminSupabase } from "@/lib/supabase/admin";

export async function subscribePushAction(formData: FormData): Promise<{ error?: string }> {
  const endpoint = String(formData.get("endpoint") ?? "").trim();
  const p256dh = String(formData.get("p256dh") ?? "").trim();
  const auth = String(formData.get("auth") ?? "").trim();

  if (!endpoint || !p256dh || !auth) {
    return { error: "Datos de suscripcion incompletos." };
  }

  const admin = createAdminSupabase();
  const { error } = await admin.from("push_subscriptions").upsert(
    { endpoint, keys_p256dh: p256dh, keys_auth: auth },
    { onConflict: "endpoint" },
  );

  if (error) return { error: "Error al guardar suscripcion." };
  return {};
}

export async function unsubscribePushAction(formData: FormData): Promise<{ error?: string }> {
  const endpoint = String(formData.get("endpoint") ?? "").trim();
  if (!endpoint) return { error: "Endpoint requerido." };

  const admin = createAdminSupabase();
  await admin.from("push_subscriptions").delete().eq("endpoint", endpoint);
  return {};
}
