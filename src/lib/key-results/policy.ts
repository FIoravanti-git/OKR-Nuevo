import "server-only";

import type { Prisma } from "@/generated/prisma";
import type { SessionUser } from "@/lib/auth/session-user";
import { institutionalProjectOptionsWhere } from "@/lib/institutional-objectives/policy";
import { canMutateInstitutionalProject, canMutateInstitutionalProjects } from "@/lib/institutional-projects/policy";
import { strategicObjectiveListWhere } from "@/lib/strategic-objectives/policy";

export function keyResultListWhere(actor: SessionUser): Prisma.KeyResultWhereInput {
  if (actor.role === "SUPER_ADMIN") {
    return {};
  }
  if (actor.companyId) {
    return { companyId: actor.companyId };
  }
  return { id: "__none__" };
}

export function canMutateKeyResults(actor: SessionUser): boolean {
  return canMutateInstitutionalProjects(actor);
}

export function canViewKeyResult(actor: SessionUser, keyResultCompanyId: string): boolean {
  if (actor.role === "SUPER_ADMIN") {
    return true;
  }
  return actor.companyId === keyResultCompanyId;
}

export function canMutateKeyResult(actor: SessionUser, keyResultCompanyId: string): boolean {
  return canMutateInstitutionalProject(actor, keyResultCompanyId);
}

/** Objetivos clave disponibles al crear un resultado clave. */
export function strategicObjectiveOptionsWhere(actor: SessionUser): Prisma.StrategicObjectiveWhereInput {
  return strategicObjectiveListWhere(actor);
}

/** Proyectos para filtros del listado (mismo alcance que proyectos institucionales). */
export function keyResultProjectFilterWhere(actor: SessionUser): Prisma.InstitutionalProjectWhereInput {
  return institutionalProjectOptionsWhere(actor);
}
