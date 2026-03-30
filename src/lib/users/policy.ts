import "server-only";

import type { Prisma, UserRole } from "@/generated/prisma";
import type { SessionUser } from "@/lib/auth/session-user";

/** Ámbito de listado según actor. */
export function userListWhere(actor: SessionUser): Prisma.UserWhereInput {
  if (actor.role === "SUPER_ADMIN") {
    return {};
  }
  if (actor.role === "ADMIN_EMPRESA" && actor.companyId) {
    return { companyId: actor.companyId };
  }
  /** Sin empresa: no debe listar filas (layout redirige; esto es defensa en profundidad). */
  return { id: "__none__" };
}

export function adminEmpresaMustHaveCompany(actor: SessionUser): boolean {
  return actor.role === "ADMIN_EMPRESA" && (actor.companyId == null || actor.companyId === "");
}

export function rolesCreatableBy(actor: SessionUser): UserRole[] {
  if (actor.role === "SUPER_ADMIN") {
    return ["SUPER_ADMIN", "ADMIN_EMPRESA", "OPERADOR"];
  }
  if (actor.role === "ADMIN_EMPRESA") {
    return ["ADMIN_EMPRESA", "OPERADOR"];
  }
  return [];
}

export function rolesAssignableBy(actor: SessionUser): UserRole[] {
  return rolesCreatableBy(actor);
}

/** ADMIN_EMPRESA no puede gestionar usuarios super ni fuera de su tenant. */
export function adminCanManageTarget(actor: SessionUser, target: { companyId: string | null; role: UserRole }): boolean {
  if (actor.role === "SUPER_ADMIN") return true;
  if (actor.role !== "ADMIN_EMPRESA" || !actor.companyId) return false;
  if (target.role === "SUPER_ADMIN") return false;
  return target.companyId === actor.companyId;
}

export function enforcedCompanyIdForWrite(actor: SessionUser, requestedCompanyId: string | null | undefined): string | null {
  if (actor.role === "SUPER_ADMIN") {
    return requestedCompanyId && requestedCompanyId.trim() !== "" ? requestedCompanyId.trim() : null;
  }
  if (actor.role === "ADMIN_EMPRESA") {
    return actor.companyId ?? null;
  }
  return null;
}
