import "server-only";

import type { ActivityStatus } from "@/generated/prisma";
import { activityStatusLabel } from "@/lib/format";
import { prisma } from "@/lib/prisma";

import type { CompanyExecutiveDashboard } from "./executive";

const ACTIVITY_STATUS_ORDER: ActivityStatus[] = [
  "PLANNED",
  "IN_PROGRESS",
  "DONE",
  "BLOCKED",
  "CANCELLED",
];

function truncateLabel(text: string, max = 44): string {
  const t = text.trim();
  if (t.length <= max) return t;
  return `${t.slice(0, max - 1)}…`;
}

export type DashboardChartsKrEntry = {
  id: string;
  label: string;
  subtitle: string;
  titleFull: string;
  objectiveTitleFull: string;
  progressPercent: number;
};

export type CompanyDashboardChartsPayload = {
  portfolioProgressPercent: number;
  projects: { id: string; title: string; titleFull: string; progressPercent: number }[];
  institutionalObjectives: { id: string; label: string; titleFull: string; progressPercent: number }[];
  activitiesByStatus: { status: ActivityStatus; label: string; count: number }[];
  keyResultsHighest: DashboardChartsKrEntry[];
  keyResultsLowest: DashboardChartsKrEntry[];
  areaPerformance: {
    areas: {
      areaId: string;
      areaName: string;
      progressPercent: number;
      totalWeight: number;
      activitiesCount: number;
      contributionPercent: number;
      status: "ON_TRACK" | "AT_RISK" | "LATE";
      blockedActivities: number;
      overdueActivities: number;
    }[];
    totalWeight: number;
    atRiskAreas: number;
    highestImpactAreaIds: string[];
  };
};

export type PlatformDashboardChartsPayload = {
  activitiesByStatus: { status: ActivityStatus; label: string; count: number }[];
};

function round1(n: number): number {
  return Math.round(n * 10) / 10;
}

/**
 * Datos para gráficos del tenant. Reutiliza progreso de proyectos ya calculado en `executive`.
 */
export async function getCompanyDashboardCharts(
  companyId: string,
  executive: CompanyExecutiveDashboard
): Promise<CompanyDashboardChartsPayload> {
  const now = new Date();
  const directAreaKrWhere = {
    progressCached: { not: null },
    strategicObjective: { institutionalObjective: { includedInGeneralProgress: true } },
  } as const;

  const strategicAreaKrWhere = {
    areaId: null,
    progressCached: { not: null },
    strategicObjective: { institutionalObjective: { includedInGeneralProgress: true } },
  } as const;

  const krSelect = {
    id: true,
    title: true,
    progressCached: true,
    strategicObjective: { select: { title: true } },
  } as const;

  const [objectives, statusGroups, krHigh, krLow, areas] = await Promise.all([
    prisma.institutionalObjective.findMany({
      where: { companyId, progressCached: { not: null }, includedInGeneralProgress: true },
      orderBy: { title: "asc" },
      take: 14,
      select: { id: true, title: true, progressCached: true },
    }),
    prisma.activity.groupBy({
      by: ["status"],
      where: { companyId },
      _count: { _all: true },
    }),
    prisma.keyResult.findMany({
      where: {
        companyId,
        progressCached: { not: null },
        strategicObjective: { institutionalObjective: { includedInGeneralProgress: true } },
      },
      orderBy: { progressCached: "desc" },
      take: 6,
      select: krSelect,
    }),
    prisma.keyResult.findMany({
      where: {
        companyId,
        progressCached: { not: null },
        strategicObjective: { institutionalObjective: { includedInGeneralProgress: true } },
      },
      orderBy: { progressCached: "asc" },
      take: 6,
      select: krSelect,
    }),
    prisma.area.findMany({
      where: { companyId, status: "ACTIVE" },
      orderBy: { name: "asc" },
      select: {
        id: true,
        name: true,
        keyResults: {
          where: directAreaKrWhere,
          select: {
            id: true,
            weight: true,
            progressCached: true,
            activities: {
              select: { status: true, dueDate: true },
            },
          },
        },
        strategicObjectives: {
          select: {
            keyResults: {
              where: strategicAreaKrWhere,
              select: {
                id: true,
                weight: true,
                progressCached: true,
                activities: {
                  select: { status: true, dueDate: true },
                },
              },
            },
          },
        },
      },
    }),
  ]);

  const countByStatus = new Map<ActivityStatus, number>();
  for (const row of statusGroups) {
    countByStatus.set(row.status, row._count._all);
  }
  const activitiesByStatus = ACTIVITY_STATUS_ORDER.map((status) => ({
    status,
    label: activityStatusLabel(status),
    count: countByStatus.get(status) ?? 0,
  })).filter((row) => row.count > 0);

  const mapKr = (k: (typeof krHigh)[0]) => ({
    id: k.id,
    label: truncateLabel(k.title, 48),
    subtitle: truncateLabel(k.strategicObjective.title, 36),
    titleFull: k.title.trim(),
    objectiveTitleFull: k.strategicObjective.title.trim(),
    progressPercent: Math.round(Number(k.progressCached) * 100) / 100,
  });

  const areaRows = areas.map((area) => {
    const krMap = new Map<
      string,
      {
        weight: number;
        progress: number;
        activities: { status: ActivityStatus; dueDate: Date | null }[];
      }
    >();

    for (const kr of area.keyResults) {
      krMap.set(kr.id, {
        weight: Number(kr.weight),
        progress: Number(kr.progressCached),
        activities: kr.activities,
      });
    }
    for (const so of area.strategicObjectives) {
      for (const kr of so.keyResults) {
        if (!krMap.has(kr.id)) {
          krMap.set(kr.id, {
            weight: Number(kr.weight),
            progress: Number(kr.progressCached),
            activities: kr.activities,
          });
        }
      }
    }

    const krs = [...krMap.values()];
    const totalWeight = krs.reduce((sum, kr) => sum + Math.max(0, kr.weight), 0);
    const weightedProgressSum = krs.reduce((sum, kr) => sum + Math.max(0, kr.weight) * kr.progress, 0);
    const progressPercent = totalWeight > 0 ? weightedProgressSum / totalWeight : 0;
    const allActivities = krs.flatMap((kr) => kr.activities);
    const blockedActivities = allActivities.filter((a) => a.status === "BLOCKED").length;
    const overdueActivities = allActivities.filter(
      (a) => a.dueDate && a.dueDate.getTime() < now.getTime() && a.status !== "DONE" && a.status !== "CANCELLED"
    ).length;

    let status: "ON_TRACK" | "AT_RISK" | "LATE" = "ON_TRACK";
    if (overdueActivities > 0) {
      status = "LATE";
    } else if (blockedActivities > 0 || progressPercent < 55) {
      status = "AT_RISK";
    }

    return {
      areaId: area.id,
      areaName: area.name,
      progressPercent: round1(progressPercent),
      totalWeight,
      weightedProgressSum,
      activitiesCount: allActivities.length,
      blockedActivities,
      overdueActivities,
      status,
    };
  });

  const totalProgressMass = areaRows.reduce((sum, area) => sum + area.weightedProgressSum, 0);
  const normalizedAreas = areaRows
    .filter((area) => area.totalWeight > 0 || area.activitiesCount > 0)
    .map((area) => ({
      areaId: area.areaId,
      areaName: area.areaName,
      progressPercent: area.progressPercent,
      totalWeight: round1(area.totalWeight),
      activitiesCount: area.activitiesCount,
      contributionPercent: round1(totalProgressMass > 0 ? (area.weightedProgressSum / totalProgressMass) * 100 : 0),
      status: area.status,
      blockedActivities: area.blockedActivities,
      overdueActivities: area.overdueActivities,
    }))
    .sort((a, b) => b.contributionPercent - a.contributionPercent);

  const highestImpactAreaIds = normalizedAreas.slice(0, 3).map((area) => area.areaId);
  const atRiskAreas = normalizedAreas.filter((area) => area.status !== "ON_TRACK").length;

  return {
    portfolioProgressPercent: executive.portfolioProgressPercent,
    projects: executive.projects.map((p) => ({
      id: p.id,
      title: truncateLabel(p.title, 40),
      titleFull: p.title.trim(),
      progressPercent: p.progressPercent,
    })),
    institutionalObjectives: objectives.map((o) => ({
      id: o.id,
      label: truncateLabel(o.title, 48),
      titleFull: o.title.trim(),
      progressPercent: Math.round(Number(o.progressCached) * 100) / 100,
    })),
    activitiesByStatus,
    keyResultsHighest: krHigh.map(mapKr),
    keyResultsLowest: krLow.map(mapKr),
    areaPerformance: {
      areas: normalizedAreas,
      totalWeight: round1(normalizedAreas.reduce((sum, area) => sum + area.totalWeight, 0)),
      atRiskAreas,
      highestImpactAreaIds,
    },
  };
}

export async function getPlatformDashboardCharts(): Promise<PlatformDashboardChartsPayload> {
  const statusGroups = await prisma.activity.groupBy({
    by: ["status"],
    _count: { _all: true },
  });
  const countByStatus = new Map<ActivityStatus, number>();
  for (const row of statusGroups) {
    countByStatus.set(row.status, row._count._all);
  }
  const activitiesByStatus = ACTIVITY_STATUS_ORDER.map((status) => ({
    status,
    label: activityStatusLabel(status),
    count: countByStatus.get(status) ?? 0,
  })).filter((row) => row.count > 0);

  return { activitiesByStatus };
}
