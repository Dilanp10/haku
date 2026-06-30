import "server-only";
import { redirect } from "next/navigation";
import {
  createSupabaseAuthAdapter,
  getCurrentUser,
  getProfile,
  requireRole,
  type Profile,
  type Role,
} from "@haku/auth";
import { createServerSupabase } from "./supabase/server";

/**
 * Resuelve el perfil con rol del usuario actual. Composition root del auth:
 * combina el adapter Supabase con los use-cases puros del módulo @haku/auth.
 */
export async function getCurrentProfile(): Promise<Profile | null> {
  const supabase = await createServerSupabase();
  const port = createSupabaseAuthAdapter(supabase);
  const user = await getCurrentUser(port);
  if (!user) return null;
  const res = await getProfile(port, user.id);
  return res.ok ? res.value : null;
}

/**
 * Guarda para rutas/Server Actions que exigen un rol mínimo.
 * Redirige a /login si no hay sesión; lanza si el rol es insuficiente
 * (la página /admin/layout muestra el error de forma amigable).
 */
export async function requireProfile(min: Role): Promise<Profile> {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login?from=admin");
  const check = requireRole(profile, min);
  if (!check.ok) throw check.error;
  return profile;
}
