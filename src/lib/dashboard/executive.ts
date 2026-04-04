import "server-only";

import type { ActivityStatus } from "@/generated/prisma";
import { prismaActivityOverdueWhere } from "@/lib/activities/overdue";
import { computeProjectProgressFromInstitutionalObjectives } from "@/lib/okr/strategic-progress-engine";
import { prisma } from "@/lib/prisma";

export type ExecutiveProjectRow = {
  id: string;
  title: string;
  /** Siempre 0–100 (calculado desde OI del proyecto, igual que `progress_cached`). */
  progressPercent: number;
};

export type ExecutiveInstitutionalObjectiveRow = {
  id: string;
  title: string;
  progressPercent: number;
  projectId: string;
  projectTitle: string;
};

export type ExecutiveKeyResultRiskRow = {
  id: string;
  title: string;
  progressPercent: number | null;
  strategicObjectiveTitle: string;
};

export type ExecutiveActivityRow = {
  id: string;
  title: string;
  keyResultTitle: string;
  dueDate?: Date;
  status?: ActivityStatus;
  updatedAt?: Date;
};

export type ExecutiveCriticalKeyResult = {
  id: string;
  title: string;
  progressPercent: number;
  strategicObjectiveTitle: string;
  institutionalObjectiveTitle: string;
  projectTitle: string;
};

export type ExecutiveCriticalStrategicObjective = {
  id: string;
  title: string;
  progressPercent: number;
  institutionalObjectiveTitle: string;
  projectTitle: string;
};

export type ExecutiveCriticalActivity = {
  id: string;
  title: string;
  keyResultTitle: string;
  kind: "overdue" | "blocked";
  dueDate?: Date;
  updatedAt?: Date;
};

/** KRs con mayor avance consolidado (para panel ejecutivo). */
export type ExecutiveKeyResultHighlightRow = {
  id: string;
  title: string;
  progressPercent: number;
  strategicObjectiveTitle: string;
};

/** Objetivos clave con avance alto pero aún no completos (entre 80 % y 99,99 %). */
export type ExecutiveStrategicObjectiveNearCompleteRow = {
  id: string;
  title: string;
  progressPercent: number;
  institutionalObjectiveTitle: string;
  projectTitle: string;
};

/**
 * Vencidas primero (fecha de vencimiento más antigua = mayor urgencia), luego bloqueadas (más recientes).
 */
function mergeCriticalActivitiesByImpact(
  overdue: ExecutiveActivityRow[],
  blocked: ExecutiveActivityRow[],
  limit: number
): ExecutiveCriticalActivity[] {
  const oSorted = [...overdue].sort(
    (a, b) => (a.dueDate?.getTime() ?? 0) - (b.dueDate?.getTime() ?? 0)
  );
  const bSorted = [...blocked].sort(
    (a, b) => (b.updatedAt?.getTime() ?? 0) - (a.updatedAt?.getTime() ?? 0)
  );
  const merged: ExecutiveCriticalActivity[] = [
    ...oSorted.map((a) => ({
      id: a.id,
      title: a.title,
      keyResultTitle: a.keyResultTitle,
      kind: "overdue" as const,
      dueDate: a.dueDate,
    })),
    ...bSorted.map((a) => ({
      id: a.id,
      title: a.title,
      keyResultTitle: a.keyResultTitle,
      kind: "blocked" as const,
      updatedAt: a.updatedAt,
    })),
  ];
  return merged.slice(0, limit);
}

/**
 * Indicadores ejecutivos por empresa (progreso cacheado y estados operativos).
 */
export async function getCompanyExecutiveDashboard(companyId: string) {
  const overdueWhere = prismaActivityOverdueWhere(companyId);

  const [
    projects,
    lowestInstitutionalObjectives,
    keyResultsAtRisk,
    lowestKeyResultsByProgress,
    lowestStrategicObjectivesByProgress,
    activitiesOverdue,
    activitiesOverdueCount,
    activitiesBlocked,
    activitiesCompletedRecent,
    highestKeyResultsByProgress,
    strategicObjectivesNearComplete,
  ] = await Promise.all([
    prisma.institutionalProject.findMany({
      where: { companyId },
      select: {
        id: true,
        title: true,
        objectives: { select: { weight: true, progressCached: true, includedInGeneralProgress: true } },
      },
      orderBy: [{ year: "desc" }, { title: "asc" }],
    }),
    prisma.institutionalObjective.findMany({
      where: { companyId, progressCached: { not: null }, includedInGeneralProgress: true },
      orderBy: { progressCached: "asc" },
      take: 6,
      select: {
        id: true,
        title: true,
        progressCached: true,
        institutionalProject: { select: { id: true, title: true } },
      },
    }),
    prisma.keyResult.findMany({
      where: {
        companyId,
        status: "AT_RISK",
        strategicObjective: { institutionalObjective: { includedInGeneralProgress: true } },
      },
      orderBy: { updatedAt: "desc" },
      take: 8,
      select: {
        id: true,
        title: true,
        progressCached: true,
        strategicObjective: { select: { title: true } },
      },
    }),
    prisma.keyResult.findMany({
      where: {
        companyId,
        progressCached: { not: null },
        strategicObjective: { institutionalObjective: { includedInGeneralProgress: true } },
      },
      orderBy: { progressCached: "asc" },
      take: 1,
      select: {
        id: true,
        title: true,
        progressCached: true,
        strategicObjective: {
          select: {
            title: true,
            institutionalObjective: {
              select: {
                title: true,
                institutionalProject: { select: { title: true } },
              },
            },
          },
        },
      },
    }),
    prisma.strategicObjective.findMany({
      where: {
        companyId,
        progressCached: { not: null },
        institutionalObjective: { includedInGeneralProgress: true },
      },
      orderBy: { progressCached: "asc" },
      take: 1,
      select: {
        id: true,
        title: true,
        progressCached: true,
        institutionalObjective: {
          select: {
            title: true,
            institutionalProject: { select: { title: true } },
          },
        },
      },
    }),
    prisma.activity.findMany({
      where: overdueWhere,
      orderBy: { dueDate: "asc" },
      take: 10,
      select: {
        id: true,
        title: true,
        dueDate: true,
        status: true,
        keyResult: { select: { title: true } },
      },
    }),
    prisma.activity.count({ where: overdueWhere }),
    prisma.activity.findMany({
      where: { companyId, status: "BLOCKED" },
      orderBy: { updatedAt: "desc" },
      take: 8,
      select: {
        id: true,
        title: true,
        updatedAt: true,
        keyResult: { select: { title: true } },
      },
    }),
    prisma.activity.findMany({
      where: { companyId, status: "DONE" },
      orderBy: { updatedAt: "desc" },
      take: 10,
      select: {
        id: true,
        title: true,
        updatedAt: true,
        keyResult: { select: { title: true } },
      },
    }),
    prisma.keyResult.findMany({
      where: {
        companyId,
        progressCached: { not: null },
        strategicObjective: { institutionalObjective: { includedInGeneralProgress: true } },
      },
      orderBy: { progressCached: "desc" },
      take: 6,
      select: {
        id: true,
        title: true,
        progressCached: true,
        strategicObjective: { select: { title: true } },
      },
    }),
    prisma.strategicObjective.findMany({
      where: {
        companyId,
        progressCached: { gte: 80, lt: 100 },
        institutionalObjective: { includedInGeneralProgress: true },
      },
      orderBy: { progressCached: "desc" },
      take: 6,
      select: {
        id: true,
        title: true,
        progressCached: true,
        institutionalObjective: {
          select: {
            title: true,
            institutionalProject: { select: { title: true } },
          },
        },
      },
    }),
  ]);

  const projectRows: ExecutiveProjectRow[] = projects.map((p) => {
    const inGeneral = p.objectives.filter((o) => o.includedInGeneralProgress);
    return {
      id: p.id,
      title: p.title,
      progressPercent: computeProjectProgressFromInstitutionalObjectives(
        inGeneral.map((o) => ({
          weight: Number(o.weight),
          progress: o.progressCached != null ? Number(o.progressCached) : null,
        }))
      ),
    };
  });

  const portfolioProgressPercent =
    projectRows.length === 0
      ? 0
      : projectRows.reduce((sum, p) => sum + p.progressPercent, 0) / projectRows.length;

  const ioRows: ExecutiveInstitutionalObjectiveRow[] = lowestInstitutionalObjectives.map((o) => ({
    id: o.id,
    title: o.title,
    progressPercent: Number(o.progressCached),
    projectId: o.institutionalProject.id,
    projectTitle: o.institutionalProject.title,
  }));

  const krRows: ExecutiveKeyResultRiskRow[] = keyResultsAtRisk.map((k) => ({
    id: k.id,
    title: k.title,
    progressPercent: k.progressCached != null ? Number(k.progressCached) : null,
    strategicObjectiveTitle: k.strategicObjective.title,
  }));

  const overdueRows: ExecutiveActivityRow[] = activitiesOverdue.map((a) => ({
    id: a.id,
    title: a.title,
    keyResultTitle: a.keyResult.title,
    dueDate: a.dueDate ?? undefined,
    status: a.status,
  }));

  const blockedRows: ExecutiveActivityRow[] = activitiesBlocked.map((a) => ({
    id: a.id,
    title: a.title,
    keyResultTitle: a.keyResult.title,
    updatedAt: a.updatedAt,
  }));

  const doneRows: ExecutiveActivityRow[] = activitiesCompletedRecent.map((a) => ({
    id: a.id,
    title: a.title,
    keyResultTitle: a.keyResult.title,
    updatedAt: a.updatedAt,
  }));

  const krLow = lowestKeyResultsByProgress[0];
  const criticalLowestKeyResult: ExecutiveCriticalKeyResult | null = krLow
    ? {
        id: krLow.id,
        title: krLow.title,
        progressPercent: Number(krLow.progressCached),
        strategicObjectiveTitle: krLow.strategicObjective.title,
        institutionalObjectiveTitle: krLow.strategicObjective.institutionalObjective.title,
        projectTitle: krLow.strategicObjective.institutionalObjective.institutionalProject.title,
      }
    : null;

  const soLow = lowestStrategicObjectivesByProgress[0];
  const criticalLowestStrategicObjective: ExecutiveCriticalStrategicObjective | null = soLow
    ? {
        id: soLow.id,
        title: soLow.title,
        progressPercent: Number(soLow.progressCached),
        institutionalObjectiveTitle: soLow.institutionalObjective.title,
        projectTitle: soLow.institutionalObjective.institutionalProject.title,
      }
    : null;

  const criticalActivities = mergeCriticalActivitiesByImpact(overdueRows, blockedRows, 8);

  const highlightTopKeyResults: ExecutiveKeyResultHighlightRow[] = highestKeyResultsByProgress.map((k) => ({
    id: k.id,
    title: k.title,
    progressPercent: Number(k.progressCached),
    strategicObjectiveTitle: k.strategicObjective.title,
  }));

  const highlightNearCompleteStrategicObjectives: ExecutiveStrategicObjectiveNearCompleteRow[] =
    strategicObjectivesNearComplete.map((o) => ({
      id: o.id,
      title: o.title,
      progressPercent: Number(o.progressCached),
      institutionalObjectiveTitle: o.institutionalObjective.title,
      projectTitle: o.institutionalObjective.institutionalProject.title,
    }));

  return {
    portfolioProgressPercent,
    projects: projectRows,
    lowestInstitutionalObjectives: ioRows,
    keyResultsAtRisk: krRows,
    criticalLowestKeyResult,
    criticalLowestStrategicObjective,
    criticalActivities,
    activitiesOverdue: overdueRows,
    activitiesOverdueCount,
    activitiesBlocked: blockedRows,
    activitiesCompletedRecent: doneRows,
    highlightTopKeyResults,
    highlightNearCompleteStrategicObjectives,
  };
}

export type CompanyExecutiveDashboard = Awaited<ReturnType<typeof getCompanyExecutiveDashboard>>;
