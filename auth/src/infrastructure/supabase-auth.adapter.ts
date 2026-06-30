import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@haku/shared";

type HakuSupabaseClient = SupabaseClient<Database, "public", any, any, any>;
import type { AuthPort } from "../application/ports/auth.port.js";
import type { AuthUser, Profile } from "../domain/role.js";

/**
 * Adapter de Supabase Auth.
 * SCAFFOLD (SDD, Fase 2): firma fijada por el SPEC; el mapeo de `profiles` se completa
 * al implementar el módulo (incluye trigger de creación de perfil en la migración).
 */
export function createSupabaseAuthAdapter(client: HakuSupabaseClient): AuthPort {
  return {
    async getCurrentUser(): Promise<AuthUser | null> {
      const { data } = await client.auth.getUser();
      if (!data.user) return null;
      return { id: data.user.id, email: data.user.email ?? null };
    },
    async getProfile(userId: string): Promise<Profile | null> {
      const res = await client
        .from("profiles")
        .select("id, display_name, role, avatar_url, created_at")
        .eq("id", userId)
        .maybeSingle();
      if (res.error) throw res.error;
      const row = res.data as
        | {
            id: string;
            display_name: string | null;
            role: Profile["role"];
            avatar_url: string | null;
            created_at: string;
          }
        | null;
      if (!row) return null;
      return {
        id: row.id,
        displayName: row.display_name,
        role: row.role,
        ...(row.avatar_url !== null ? { avatarUrl: row.avatar_url } : {}),
        createdAt: row.created_at,
      };
    },
  };
}
