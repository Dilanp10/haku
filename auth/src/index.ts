// API pública de @haku/auth.
export { ROLES, hasAtLeast } from "./domain/role.js";
export type { Role, Profile, AuthUser } from "./domain/role.js";
export type { AuthPort } from "./application/ports/auth.port.js";
export {
  getCurrentUser,
  getProfile,
  requireRole,
} from "./application/use-cases/auth.use-cases.js";
export { createSupabaseAuthAdapter } from "./infrastructure/supabase-auth.adapter.js";
