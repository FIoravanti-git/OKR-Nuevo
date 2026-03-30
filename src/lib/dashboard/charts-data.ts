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
};

export type PlatformDashboardChartsPayload = {
  activitiesByStatus: { status: ActivityStatus; label: string; count: number }[];
};

/**
 * Datos para gráficos del tenant. Reutiliza progreso de proyectos ya calculado en `executive`.
 */
export async function getCompanyDashboardCharts(
  companyId: string,
  executive: CompanyExecutiveDashboard
): Promise<CompanyDashboardChartsPayload> {
  const krSelect = {
    id: true,
    title: true,
    progressCached: true,
    strategicObjective: { select: { title: true } },
  } as const;

  const [objectives, statusGroups, krHigh, krLow] = await Promise.all([
    prisma.institutionalObjective.findMany({
      where: { companyId, progressCached: { not: null } },
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
      where: { companyId, progressCached: { not: null } },
      orderBy: { progressCached: "desc" },
      take: 6,
      select: krSelect,
    }),
    prisma.keyResult.findMany({
      where: { companyId, progressCached: { not: null } },
      orderBy: { progressCached: "asc" },
      take: 6,
      select: krSelect,
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
