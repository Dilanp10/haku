import { createClient } from "@supabase/supabase-js";
import type { Database } from "@haku/shared";
import { env } from "../env.js";
import { serverEnv } from "../env.js";

/**
 * Cliente con SERVICE ROLE. Bypassa RLS. SOLO en servidor (jobs de ingesta,
 * tareas administrativas). Nunca importar desde código que llegue al cliente.
 */
export function createAdminSupabase() {
  if (!serverEnv.serviceRoleKey) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY no configurada (requerida para tareas admin/ingesta)");
  }
  return createClient<Database>(env.supabaseUrl, serverEnv.serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
