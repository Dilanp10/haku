export const ROLES = ["visitor", "editor", "admin"] as const;
export type Role = (typeof ROLES)[number];

const RANK: Record<Role, number> = { visitor: 0, editor: 1, admin: 2 };

/** Jerarquía pura: ¿`role` cumple al menos `min`? */
export function hasAtLeast(role: Role, min: Role): boolean {
  return RANK[role] >= RANK[min];
}

export interface AuthUser {
  id: string;
  email: string | null;
}

export interface Profile {
  id: string;
  displayName: string | null;
  role: Role;
  avatarUrl?: string | null;
  createdAt: string;
}
