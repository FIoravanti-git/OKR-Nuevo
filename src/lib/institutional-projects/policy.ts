import "server-only";

import type { Prisma } from "@/generated/prisma";
import type { SessionUser } from "@/lib/auth/session-user";

export function institutionalProjectListWhere(actor: SessionUser): Prisma.InstitutionalProjectWhereInput {
  if (actor.role === "SUPER_ADMIN") {
    return {};
  }
  if (actor.companyId) {
    return { companyId: actor.companyId };
  }
  return { id: "__none__" };
}

export function canMutateInstitutionalProjects(actor: SessionUser): boolean {
  return actor.role === "SUPER_ADMIN" || actor.role === "ADMIN_EMPRESA";
}

export function canViewInstitutionalProject(actor: SessionUser, projectCompanyId: string): boolean {
  if (actor.role === "SUPER_ADMIN") {
    return true;
  }
  return actor.companyId === projectCompanyId;
}

export function canMutateInstitutionalProject(actor: SessionUser, projectCompanyId: string): boolean {
  if (!canMutateInstitutionalProjects(actor)) {
    return false;
  }
  if (actor.role === "SUPER_ADMIN") {
    return true;
  }
  return actor.companyId === projectCompanyId;
}

/** Alta: admin siempre su empresa; super elige empresa en el formulario. */
export function resolvedCompanyIdForProjectCreate(
  actor: SessionUser,
  requestedCompanyId: string | undefined
): string | null {
  if (actor.role === "ADMIN_EMPRESA") {
    return actor.companyId ?? null;
  }
  if (actor.role === "SUPER_ADMIN") {
    const t = requestedCompanyId?.trim();
    return t && t !== "" ? t : null;
  }
  return null;
}
