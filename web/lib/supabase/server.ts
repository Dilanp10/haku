import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { Database } from "@haku/shared";
import { env } from "../env.js";

/**
 * Cliente Supabase para Server Components / Server Actions / route handlers.
 * Usa la ANON key + cookies de sesión: la RLS aplica al usuario actual.
 */
export async function createServerSupabase() {
  const cookieStore = await cookies();
  return createServerClient<Database>(env.supabaseUrl, env.supabaseAnonKey, {
    cookies: {
      getAll: () => cookieStore.getAll(),
      setAll: (toSet: { name: string; value: string; options: CookieOptions }[]) => {
        try {
          toSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
        } catch {
          // Llamado desde un Server Component (cookies de solo lectura): ignorar.
        }
      },
    },
  });
}
