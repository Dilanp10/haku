import type { AuthUser, Profile } from "../../domain/role";

/** Puerto de identidad. Lo implementa la infraestructura (Supabase Auth). */
export interface AuthPort {
  getCurrentUser(): Promise<AuthUser | null>;
  getProfile(userId: string): Promise<Profile | null>;
}
