// API pública de @haku/auth.
export { ROLES, hasAtLeast } from "./domain/role";
export type { Role, Profile, AuthUser } from "./domain/role";
export type { AuthPort } from "./application/ports/auth.port";
export {
  getCurrentUser,
  getProfile,
  requireRole,
} from "./application/use-cases/auth.use-cases";
export { createSupabaseAuthAdapter } from "./infrastructure/supabase-auth.adapter";
