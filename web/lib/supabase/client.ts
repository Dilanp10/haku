"use client";

import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "@haku/shared";
import { env } from "../env.js";

/** Cliente Supabase para componentes cliente (anon key + RLS). */
export function createClientSupabase() {
  return createBrowserClient<Database>(env.supabaseUrl, env.supabaseAnonKey);
}
