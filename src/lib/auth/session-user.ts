import "server-only";

import { redirect } from "next/navigation";
import { auth } from "@/auth";
import type { UserRole } from "@/generated/prisma";

/** Usuario autenticado con los campos que persistimos en JWT/sesión. */
export type SessionUser = {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  companyId: string | null;
  companyName: string | null;
};

/** Sesión actual o `null` si no hay usuario autenticado. */
export async function getSessionUser(): Promise<SessionUser | null> {
  const session = await auth();
  const u = session?.user;
  if (!u?.id) return null;
  return {
    id: u.id,
    email: u.email,
    name: u.name,
    role: u.role,
    companyId: u.companyId,
    companyName: u.companyName,
  };
}

/** Igual que `getSessionUser` pero nunca retorna null: redirige a `/login`. */
export async function requireSessionUser(): Promise<SessionUser> {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  return user;
}

/**
 * Requiere uno de los roles indicados. Si no coincide, redirige a `/dashboard`.
 * Usar en server components / server actions tras `requireSessionUser` implícito.
 */
export async function requireRole(...allowed: UserRole[]): Promise<SessionUser> {
  const user = await requireSessionUser();
  if (!allowed.includes(user.role)) {
    redirect("/dashboard");
  }
  return user;
}

/** Comprueba rol sin redirigir (p. ej. para ramificar UI en servidor). */
export function hasRole(user: SessionUser, ...roles: UserRole[]): boolean {
  return roles.includes(user.role);
}
