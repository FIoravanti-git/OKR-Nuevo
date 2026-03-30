import "server-only";

import type { Prisma } from "@/generated/prisma";
import type { SessionUser } from "@/lib/auth/session-user";
import { keyResultListWhere } from "@/lib/key-results/policy";
import { canMutateInstitutionalProject, canMutateInstitutionalProjects } from "@/lib/institutional-projects/policy";

export function activityListWhere(actor: SessionUser): Prisma.ActivityWhereInput {
  if (actor.role === "SUPER_ADMIN") {
    return {};
  }
  if (actor.companyId) {
    return { companyId: actor.companyId };
  }
  return { id: "__none__" };
}

export function canMutateActivities(actor: SessionUser): boolean {
  return canMutateInstitutionalProjects(actor);
}

export function canViewActivity(actor: SessionUser, activityCompanyId: string): boolean {
  if (actor.role === "SUPER_ADMIN") {
    return true;
  }
  return actor.companyId === activityCompanyId;
}

/** Alta / edición completa / baja (admin empresa o super). */
export function canMutateActivity(actor: SessionUser, activityCompanyId: string): boolean {
  return canMutateInstitutionalProject(actor, activityCompanyId);
}

/**
 * Seguimiento de avance: admins del tenant o super; operador si es responsable o la tarea aún no tiene responsable.
 * Punto de extensión para un motor de reglas más estricto.
 */
export function canUpdateActivityProgress(
  actor: SessionUser,
  activity: { companyId: string; assigneeUserId: string | null }
): boolean {
  if (canMutateActivity(actor, activity.companyId)) {
    return true;
  }
  if (actor.role !== "OPERADOR" || !actor.companyId) {
    return false;
  }
  if (actor.companyId !== activity.companyId) {
    return false;
  }
  return activity.assigneeUserId === actor.id || activity.assigneeUserId == null;
}

export function keyResultOptionsWhere(actor: SessionUser): Prisma.KeyResultWhereInput {
  return keyResultListWhere(actor);
}
