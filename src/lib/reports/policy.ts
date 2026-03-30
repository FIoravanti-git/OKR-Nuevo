import "server-only";

import type { Prisma } from "@/generated/prisma";
import type { SessionUser } from "@/lib/auth/session-user";
import { activityListWhere } from "@/lib/activities/policy";
import { institutionalObjectiveListWhere } from "@/lib/institutional-objectives/policy";
import { institutionalProjectListWhere } from "@/lib/institutional-projects/policy";
import { keyResultListWhere } from "@/lib/key-results/policy";
import { strategicObjectiveListWhere } from "@/lib/strategic-objectives/policy";

import type { ReportFilters } from "@/lib/reports/types";

/** Empresa efectiva: tenant fijo salvo super admin con filtro explícito. */
export function reportsEffectiveCompanyId(
  actor: SessionUser,
  requestedCompanyId: string | null
): string | null {
  if (actor.role !== "SUPER_ADMIN") {
    return actor.companyId;
  }
  return requestedCompanyId;
}

export function reportProjectBaseWhere(
  actor: SessionUser,
  filters: ReportFilters
): Prisma.InstitutionalProjectWhereInput {
  const and: Prisma.InstitutionalProjectWhereInput[] = [institutionalProjectListWhere(actor)];

  if (filters.companyId) {
    and.push({ companyId: filters.companyId });
  }
  if (filters.projectId) {
    and.push({ id: filters.projectId });
  }
  if (filters.projectStatus) {
    and.push({ status: filters.projectStatus });
  }

  return and.length === 1 ? and[0]! : { AND: and };
}

export function reportActivityWhere(
  actor: SessionUser,
  filters: ReportFilters
): Prisma.ActivityWhereInput {
  const and: Prisma.ActivityWhereInput[] = [activityListWhere(actor)];

  if (filters.companyId && actor.role === "SUPER_ADMIN") {
    and.push({ companyId: filters.companyId });
  }

  if (filters.projectId) {
    and.push({
      keyResult: {
        is: {
          strategicObjective: {
            is: {
              institutionalObjective: { is: { institutionalProjectId: filters.projectId } },
            },
          },
        },
      },
    });
  }

  if (filters.activityStatus) {
    and.push({ status: filters.activityStatus });
  }

  if (filters.dateFrom || filters.dateTo) {
    and.push({
      createdAt: {
        ...(filters.dateFrom ? { gte: filters.dateFrom } : {}),
        ...(filters.dateTo ? { lte: filters.dateTo } : {}),
      },
    });
  }

  return and.length === 1 ? and[0]! : { AND: and };
}

/** Actividades para KPIs de resumen: mismo alcance pero sin filtro de fechas (vista “stock”). */
export function reportActivityStockWhere(
  actor: SessionUser,
  filters: ReportFilters
): Prisma.ActivityWhereInput {
  const and: Prisma.ActivityWhereInput[] = [activityListWhere(actor)];

  if (filters.companyId && actor.role === "SUPER_ADMIN") {
    and.push({ companyId: filters.companyId });
  }

  if (filters.projectId) {
    and.push({
      keyResult: {
        is: {
          strategicObjective: {
            is: {
              institutionalObjective: { is: { institutionalProjectId: filters.projectId } },
            },
          },
        },
      },
    });
  }

  if (filters.activityStatus) {
    and.push({ status: filters.activityStatus });
  }

  return and.length === 1 ? and[0]! : { AND: and };
}

export function institutionalObjectiveReportWhere(
  actor: SessionUser,
  projectIds: string[],
  filters: ReportFilters
): Prisma.InstitutionalObjectiveWhereInput {
  if (projectIds.length === 0) {
    return { id: "__none__" };
  }

  const and: Prisma.InstitutionalObjectiveWhereInput[] = [
    institutionalObjectiveListWhere(actor),
    { institutionalProjectId: { in: projectIds } },
  ];

  if (filters.companyId && actor.role === "SUPER_ADMIN") {
    and.push({ companyId: filters.companyId });
  }

  return { AND: and };
}

export function strategicObjectiveReportWhere(
  actor: SessionUser,
  projectIds: string[],
  filters: ReportFilters
): Prisma.StrategicObjectiveWhereInput {
  if (projectIds.length === 0) {
    return { id: "__none__" };
  }

  const and: Prisma.StrategicObjectiveWhereInput[] = [
    strategicObjectiveListWhere(actor),
    {
      institutionalObjective: {
        institutionalProjectId: { in: projectIds },
      },
    },
  ];

  if (filters.companyId && actor.role === "SUPER_ADMIN") {
    and.push({ companyId: filters.companyId });
  }

  return { AND: and };
}

export function keyResultReportWhere(
  actor: SessionUser,
  projectIds: string[],
  filters: ReportFilters
): Prisma.KeyResultWhereInput {
  if (projectIds.length === 0) {
    return { id: "__none__" };
  }

  const and: Prisma.KeyResultWhereInput[] = [
    keyResultListWhere(actor),
    {
      strategicObjective: {
        institutionalObjective: {
          institutionalProjectId: { in: projectIds },
        },
      },
    },
  ];

  if (filters.companyId && actor.role === "SUPER_ADMIN") {
    and.push({ companyId: filters.companyId });
  }

  return { AND: and };
}

/** Logs de avance de KR alineados al mismo alcance que el resto del reporte ejecutivo. */
export function reportKeyResultProgressLogWhere(
  actor: SessionUser,
  projectIds: string[],
  filters: ReportFilters
): Prisma.KeyResultProgressLogWhereInput {
  if (projectIds.length === 0) {
    return { id: "__none__" };
  }

  const krNested = keyResultReportWhere(actor, projectIds, filters);
  const and: Prisma.KeyResultProgressLogWhereInput[] = [
    { keyResult: { is: krNested } },
    { newProgress: { not: null } },
  ];

  if (filters.companyId && actor.role === "SUPER_ADMIN") {
    and.push({ companyId: filters.companyId });
  }

  return and.length === 1 ? and[0]! : { AND: and };
}
