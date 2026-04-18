import { apiFetch } from "../api";

export type Role = "ADMIN" | "RECEPTIONIST" | "USER";

export type Me = {
  id?: number;
  email?: string;
  username?: string;
  name?: string;
  picture?: string;
  role?: string;
};

export type AuthUser = {
  id: number;
  email: string;
  username: string;
  name: string;
  picture?: string;
  role: Role;
};

export function normalizeRole(role?: string): Role {
  if (role === "ADMIN" || role === "RECEPTIONIST") {
    return role;
  }

  return "USER";
}

export function normalizeMe(me: Me | null | undefined): AuthUser | null {
  if (!me?.id || !me.email) {
    return null;
  }

  return {
    id: me.id,
    email: me.email,
    username: me.username || me.email,
    name: me.name || me.username || me.email,
    picture: me.picture,
    role: normalizeRole(me.role),
  };
}

export async function getMe(): Promise<AuthUser | null> {
  try {
    const me = await apiFetch<Me>("/api/auth/me");
    return normalizeMe(me);
  } catch {
    return null;
  }
}

export async function logoutRequest(): Promise<void> {
  await apiFetch<unknown>("/api/auth/logout", {
    method: "POST",
  });
}
