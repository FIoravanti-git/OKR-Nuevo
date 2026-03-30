import "server-only";

import type { Prisma } from "@/generated/prisma";
import type { SessionUser } from "@/lib/auth/session-user";
import {
  canMutateInstitutionalProject,
  canMutateInstitutionalProjects,
  institutionalProjectListWhere,
} from "@/lib/institutional-projects/policy";

export function institutionalObjectiveListWhere(actor: SessionUser): Prisma.InstitutionalObjectiveWhereInput {
  if (actor.role === "SUPER_ADMIN") {
    return {};
  }
  if (actor.companyId) {
    return { companyId: actor.companyId };
  }
  return { id: "__none__" };
}

export function canMutateInstitutionalObjectives(actor: SessionUser): boolean {
  return canMutateInstitutionalProjects(actor);
}

export function canViewInstitutionalObjective(actor: SessionUser, objectiveCompanyId: string): boolean {
  if (actor.role === "SUPER_ADMIN") {
    return true;
  }
  return actor.companyId === objectiveCompanyId;
}

export function canMutateInstitutionalObjective(actor: SessionUser, objectiveCompanyId: string): boolean {
  return canMutateInstitutionalProject(actor, objectiveCompanyId);
}

/** Proyectos que el actor puede usar al crear objetivos institucionales. */
export function institutionalProjectOptionsWhere(actor: SessionUser): Prisma.InstitutionalProjectWhereInput {
  return institutionalProjectListWhere(actor);
}
