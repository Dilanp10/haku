import { type Result, ok, err, NotFoundError, ForbiddenError } from "@haku/shared";
import { type Role, type Profile, type AuthUser, hasAtLeast } from "../../domain/role.js";
import type { AuthPort } from "../ports/auth.port.js";

export async function getCurrentUser(port: AuthPort): Promise<AuthUser | null> {
  return port.getCurrentUser();
}

export async function getProfile(port: AuthPort, userId: string): Promise<Result<Profile>> {
  const profile = await port.getProfile(userId);
  return profile ? ok(profile) : err(new NotFoundError("Perfil no encontrado"));
}

/** Guarda de autorización a nivel app. La RLS sigue siendo la barrera real en la BD. */
export function requireRole(profile: Profile | null, min: Role): Result<void> {
  if (profile && hasAtLeast(profile.role, min)) return ok(undefined);
  return err(new ForbiddenError(`Se requiere rol '${min}' o superior`));
}
