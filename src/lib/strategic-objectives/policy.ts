import "server-only";

import type { Prisma } from "@/generated/prisma";
import type { SessionUser } from "@/lib/auth/session-user";
import { institutionalObjectiveListWhere } from "@/lib/institutional-objectives/policy";
import { canMutateInstitutionalProject, canMutateInstitutionalProjects } from "@/lib/institutional-projects/policy";

export function strategicObjectiveListWhere(actor: SessionUser): Prisma.StrategicObjectiveWhereInput {
  if (actor.role === "SUPER_ADMIN") {
    return {};
  }
  if (actor.companyId) {
    return { companyId: actor.companyId };
  }
  return { id: "__none__" };
}

export function canMutateStrategicObjectives(actor: SessionUser): boolean {
  return canMutateInstitutionalProjects(actor);
}

export function canViewStrategicObjective(actor: SessionUser, objectiveCompanyId: string): boolean {
  if (actor.role === "SUPER_ADMIN") {
    return true;
  }
  return actor.companyId === objectiveCompanyId;
}

export function canMutateStrategicObjective(actor: SessionUser, objectiveCompanyId: string): boolean {
  return canMutateInstitutionalProject(actor, objectiveCompanyId);
}

/** Objetivos institucionales que pueden elegirse al crear un objetivo clave. */
export function institutionalObjectiveOptionsWhere(actor: SessionUser): Prisma.InstitutionalObjectiveWhereInput {
  return institutionalObjectiveListWhere(actor);
}
