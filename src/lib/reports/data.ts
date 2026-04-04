import "server-only";

import type { Prisma } from "@/generated/prisma";
import type { SessionUser } from "@/lib/auth/session-user";
import { prisma } from "@/lib/prisma";
import { prismaActivityOverdueWhere } from "@/lib/activities/overdue";
import {
  institutionalObjectiveReportWhere,
  keyResultReportWhere,
  keyResultReportWhereForGeneralProgress,
  reportActivityWhere,
  reportKeyResultProgressLogWhere,
  reportProjectBaseWhere,
  reportsEffectiveCompanyId,
  strategicObjectiveReportWhere,
} from "@/lib/reports/policy";
import { parseReportSearchParams } from "@/lib/reports/schemas";
import type {
  ActivityStatusCount,
  AssigneeActivityRow,
  ExecutiveReportPayload,
  ExecutiveSummary,
  IoProgressRow,
  KrProgressRow,
  ProgressEvolutionPoint,
  ProjectProgressRow,
  ReportFilters,
  SoProgressRow,
} from "@/lib/reports/types";

function weightedAvgProgress(
  rows: { progressCached: Prisma.Decimal | null; weight: Prisma.Decimal }[]
): number | null {
  let sumW = 0;
  let acc = 0;
  for (const r of rows) {
    if (r.progressCached == null) continue;
    const nv = Number(r.progressCached);
    const nw = Number(r.weight);
    if (!Number.isFinite(nv) || !Number.isFinite(nw) || nw <= 0) continue;
    sumW += nw;
    acc += nv * nw;
  }
  if (sumW === 0) return null;
  return Math.round((acc / sumW) * 10) / 10;
}

function simpleAvgProgress(values: (Prisma.Decimal | null)[]): number | null {
  const nums = values
    .map((v) => (v != null ? Number(v) : null))
    .filter((n): n is number => n != null && Number.isFinite(n));
  if (nums.length === 0) return null;
  return Math.round((nums.reduce((a, b) => a + b, 0) / nums.length) * 10) / 10;
}

const ACTIVITY_STATUS_ORDER: Array<ActivityStatusCount["status"]> = [
  "PLANNED",
  "IN_PROGRESS",
  "DONE",
  "BLOCKED",
  "CANCELLED",
];

function evolutionLogDateRange(filters: ReportFilters): { gte: Date; lte: Date } {
  const lte = filters.dateTo ? new Date(filters.dateTo) : new Date();
  let gte: Date;
  if (filters.dateFrom) {
    gte = new Date(filters.dateFrom);
  } else if (filters.dateTo) {
    gte = new Date(filters.dateTo);
    gte.setFullYear(gte.getFullYear() - 1);
  } else {
    gte = new Date(lte.getTime());
    gte.setMonth(gte.getMonth() - 12);
  }
  if (gte.getTime() > lte.getTime()) {
    return { gte: lte, lte: gte };
  }
  return { gte, lte };
}

function startOfWeekMondayLocal(d: Date): Date {
  const x = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const dow = x.getDay();
  const offset = dow === 0 ? -6 : 1 - dow;
  x.setDate(x.getDate() + offset);
  x.setHours(0, 0, 0, 0);
  return x;
}

function weekBucketKey(d: Date): string {
  const s = startOfWeekMondayLocal(d);
  const y = s.getFullYear();
  const m = String(s.getMonth() + 1).padStart(2, "0");
  const day = String(s.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function weekLabelFromKey(key: string): string {
  const parts = key.split("-").map(Number);
  const y = parts[0];
  const mo = parts[1];
  const da = parts[2];
  if (y == null || mo == null || da == null) return key;
  const start = new Date(y, mo - 1, da);
  const end = new Date(start);
  end.setDate(end.getDate() + 6);
  const o = { day: "numeric", month: "short" } as const;
  return `${start.toLocaleDateString("es-UY", o)} – ${end.toLocaleDateString("es-UY", o)}`;
}

function monthBucketKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function monthLabelFromKey(key: string): string {
  const parts = key.split("-").map(Number);
  const y = parts[0];
  const mo = parts[1];
  if (y == null || mo == null) return key;
  const anchor = new Date(y, mo - 1, 1);
  return anchor.toLocaleDateString("es-UY", { month: "short", year: "numeric" });
}

function daysSpan(a: Date, b: Date): number {
  return Math.max(1, Math.ceil(Math.abs(b.getTime() - a.getTime()) / 86_400_000));
}

function aggregateKrLogProgressByPeriod(
  logs: { createdAt: Date; newProgress: Prisma.Decimal | null }[],
  rangeGte: Date,
  rangeLte: Date
): { points: ProgressEvolutionPoint[]; granularity: "week" | "month" } {
  const spanDays = daysSpan(rangeGte, rangeLte);
  const granularity: "week" | "month" = spanDays <= 92 ? "week" : "month";
  const buckets = new Map<string, number[]>();

  for (const log of logs) {
    if (log.newProgress == null) continue;
    const n = Number(log.newProgress);
    if (!Number.isFinite(n)) continue;
    const bucket =
      granularity === "week" ? weekBucketKey(log.createdAt) : monthBucketKey(log.createdAt);
    const list = buckets.get(bucket) ?? [];
    list.push(n);
    buckets.set(bucket, list);
  }

  const sortedKeys = [...buckets.keys()].sort();
  const points: ProgressEvolutionPoint[] = sortedKeys.map((key) => {
    const vals = buckets.get(key) ?? [];
    const avg = vals.reduce((acc, v) => acc + v, 0) / vals.length;
    return {
      key,
      label: granularity === "week" ? weekLabelFromKey(key) : monthLabelFromKey(key),
      avgProgress: Math.round(avg * 10) / 10,
    };
  });

  return { points, granularity };
}

function emptyPayload(filters: ReportFilters, emptyReason: string | null): ExecutiveReportPayload {
  return {
    filters,
    keyResultsShown: 0,
    summary: {
      projectsCount: 0,
      institutionalObjectivesCount: 0,
      strategicObjectivesCount: 0,
      keyResultsCount: 0,
      activitiesInScope: 0,
      activitiesDoneInScope: 0,
      activitiesOverdueInScope: 0,
      avgKeyResultProgress: null,
      avgInstitutionalObjectiveProgress: null,
    },
    projectProgress: [],
    ioProgress: [],
    soProgress: [],
    krProgress: [],
    activitiesByStatus: [],
    topAssignees: [],
    projectIdsInScope: [],
    emptyReason,
    progressEvolution: [],
    progressEvolutionGranularity: "month",
    progressEvolutionHint: null,
  };
}

export async function getExecutiveReportData(
  actor: SessionUser,
  rawSearchParams: Record<string, string | string[] | undefined>
): Promise<ExecutiveReportPayload> {
  const sp = parseReportSearchParams(rawSearchParams);

  const filters: ReportFilters = {
    companyId: reportsEffectiveCompanyId(actor, sp.companyId),
    projectId: sp.projectId,
    projectStatus: sp.projectStatus,
    activityStatus: sp.activityStatus,
    dateFrom: sp.from,
    dateTo: sp.to,
  };

  if (actor.role !== "SUPER_ADMIN" && !actor.companyId) {
    return emptyPayload(filters, "Tu usuario no tiene empresa asignada; no hay datos de reporte.");
  }

  const projectWhere = reportProjectBaseWhere(actor, filters);

  const projects = await prisma.institutionalProject.findMany({
    where: projectWhere,
    select: {
      id: true,
      title: true,
      status: true,
      year: true,
      company: { select: { name: true } },
    },
    orderBy: [{ companyId: "asc" }, { title: "asc" }],
  });

  const projectIds = projects.map((p) => p.id);

  if (projectIds.length === 0) {
    return emptyPayload(
      filters,
      "No hay proyectos institucionales que coincidan con el alcance y los filtros seleccionados."
    );
  }

  const ioWhere = institutionalObjectiveReportWhere(actor, projectIds, filters);
  const soWhere = strategicObjectiveReportWhere(actor, projectIds, filters);
  const krWhere = keyResultReportWhere(actor, projectIds, filters);
  const actWhere = reportActivityWhere(actor, filters);
  const actWhereDone: Prisma.ActivityWhereInput = { AND: [actWhere, { status: "DONE" }] };
  const actWhereOverdue: Prisma.ActivityWhereInput = {
    AND: [actWhere, prismaActivityOverdueWhere()],
  };

  const evRange = evolutionLogDateRange(filters);
  const krProgressLogWhere: Prisma.KeyResultProgressLogWhereInput = {
    AND: [
      reportKeyResultProgressLogWhere(actor, projectIds, filters),
      { createdAt: { gte: evRange.gte, lte: evRange.lte } },
    ],
  };

  const [
    ios,
    sos,
    krs,
    activitiesByStatusRaw,
    assigneeGroups,
    activitiesTotal,
    activitiesDone,
    activitiesOverdueCount,
    iosForAvg,
    krTotalCount,
    krProgressValues,
    krProgressLogs,
  ] = await Promise.all([
    prisma.institutionalObjective.findMany({
      where: ioWhere,
      select: {
        id: true,
        title: true,
        status: true,
        progressCached: true,
        weight: true,
        includedInGeneralProgress: true,
        institutionalProjectId: true,
        institutionalProject: { select: { title: true } },
        company: { select: { name: true } },
      },
      orderBy: [{ sortOrder: "asc" }, { title: "asc" }],
    }),
    prisma.strategicObjective.findMany({
      where: soWhere,
      select: {
        id: true,
        title: true,
        status: true,
        progressCached: true,
        weight: true,
        institutionalObjective: {
          select: {
            title: true,
            includedInGeneralProgress: true,
            institutionalProject: { select: { title: true } },
            company: { select: { name: true } },
          },
        },
      },
      orderBy: [{ sortOrder: "asc" }, { title: "asc" }],
    }),
    prisma.keyResult.findMany({
      where: krWhere,
      select: {
        id: true,
        title: true,
        status: true,
        progressCached: true,
        weight: true,
        strategicObjective: {
          select: {
            title: true,
            institutionalObjective: {
              select: {
                title: true,
                includedInGeneralProgress: true,
                institutionalProject: { select: { title: true } },
                company: { select: { name: true } },
              },
            },
          },
        },
      },
      orderBy: [{ updatedAt: "desc" }],
      take: 500,
    }),
    prisma.activity.groupBy({
      by: ["status"],
      where: actWhere,
      _count: true,
    }),
    prisma.activity.groupBy({
      by: ["assigneeUserId"],
      where: {
        AND: [actWhere, { assigneeUserId: { not: null } }],
      },
      _count: true,
    }),
    prisma.activity.count({ where: actWhere }),
    prisma.activity.count({ where: actWhereDone }),
    prisma.activity.count({ where: actWhereOverdue }),
    prisma.institutionalObjective.findMany({
      where: { AND: [ioWhere, { includedInGeneralProgress: true }] },
      select: { progressCached: true },
    }),
    prisma.keyResult.count({ where: krWhere }),
    prisma.keyResult.findMany({
      where: keyResultReportWhereForGeneralProgress(actor, projectIds, filters),
      select: { progressCached: true },
    }),
    prisma.keyResultProgressLog.findMany({
      where: krProgressLogWhere,
      select: { newProgress: true, createdAt: true },
      orderBy: { createdAt: "asc" },
      take: 12_000,
    }),
  ]);

  const iosByProject = new Map<string, typeof ios>();
  for (const io of ios) {
    const list = iosByProject.get(io.institutionalProjectId) ?? [];
    list.push(io);
    iosByProject.set(io.institutionalProjectId, list);
  }

  const projectProgress: ProjectProgressRow[] = projects.map((p) => {
    const list = iosByProject.get(p.id) ?? [];
    const inGeneral = list.filter((x) => x.includedInGeneralProgress);
    return {
      id: p.id,
      title: p.title,
      status: p.status,
      year: p.year,
      companyName: p.company.name,
      avgProgress: weightedAvgProgress(
        inGeneral.map((x) => ({ progressCached: x.progressCached, weight: x.weight }))
      ),
      objectivesCount: list.length,
    };
  });

  const ioProgress: IoProgressRow[] = ios.map((io) => ({
    id: io.id,
    title: io.title,
    status: io.status,
    progress: io.progressCached != null ? Number(io.progressCached) : null,
    weight: io.weight.toString(),
    projectTitle: io.institutionalProject.title,
    companyName: io.company.name,
    impactsGeneralProgress: io.includedInGeneralProgress,
  }));

  const soProgress: SoProgressRow[] = sos.map((so) => ({
    id: so.id,
    title: so.title,
    status: so.status,
    progress: so.progressCached != null ? Number(so.progressCached) : null,
    weight: so.weight.toString(),
    ioTitle: so.institutionalObjective.title,
    projectTitle: so.institutionalObjective.institutionalProject.title,
    companyName: so.institutionalObjective.company.name,
    impactsGeneralProgress: so.institutionalObjective.includedInGeneralProgress,
  }));

  const krProgress: KrProgressRow[] = krs.map((kr) => ({
    id: kr.id,
    title: kr.title,
    status: kr.status,
    progress: kr.progressCached != null ? Number(kr.progressCached) : null,
    weight: kr.weight.toString(),
    soTitle: kr.strategicObjective.title,
    ioTitle: kr.strategicObjective.institutionalObjective.title,
    projectTitle: kr.strategicObjective.institutionalObjective.institutionalProject.title,
    companyName: kr.strategicObjective.institutionalObjective.company.name,
    impactsGeneralProgress: kr.strategicObjective.institutionalObjective.includedInGeneralProgress,
  }));

  const statusMap = new Map(activitiesByStatusRaw.map((g) => [g.status, g._count]));
  const activitiesByStatus: ActivityStatusCount[] = ACTIVITY_STATUS_ORDER.map((status) => ({
    status,
    count: statusMap.get(status) ?? 0,
  })).filter((x) => x.count > 0);

  const sortedAssignees = [...assigneeGroups]
    .filter((g) => g.assigneeUserId != null)
    .sort((a, b) => b._count - a._count)
    .slice(0, 15);

  const assigneeIds = sortedAssignees.map((g) => g.assigneeUserId as string);
  const assigneeUsers =
    assigneeIds.length > 0
      ? await prisma.user.findMany({
          where: { id: { in: assigneeIds } },
          select: { id: true, name: true, email: true },
        })
      : [];
  const userById = new Map(assigneeUsers.map((u) => [u.id, u]));

  const topAssignees: AssigneeActivityRow[] = sortedAssignees.map((g) => {
    const u = userById.get(g.assigneeUserId as string);
    return {
      userId: g.assigneeUserId as string,
      name: u?.name ?? "Usuario",
      email: u?.email ?? "",
      count: g._count,
    };
  });

  const summary: ExecutiveSummary = {
    projectsCount: projects.length,
    institutionalObjectivesCount: ios.length,
    strategicObjectivesCount: sos.length,
    keyResultsCount: krTotalCount,
    activitiesInScope: activitiesTotal,
    activitiesDoneInScope: activitiesDone,
    activitiesOverdueInScope: activitiesOverdueCount,
    avgKeyResultProgress: simpleAvgProgress(krProgressValues.map((k) => k.progressCached)),
    avgInstitutionalObjectiveProgress: simpleAvgProgress(iosForAvg.map((x) => x.progressCached)),
  };

  const { points: progressEvolution, granularity: progressEvolutionGranularity } =
    aggregateKrLogProgressByPeriod(krProgressLogs, evRange.gte, evRange.lte);

  const progressEvolutionHint =
    filters.dateFrom || filters.dateTo
      ? null
      : "Sin filtro de fechas: se muestran los últimos 12 meses según la fecha de cada registro de avance del resultado clave.";

  return {
    filters,
    summary,
    projectProgress,
    ioProgress,
    soProgress,
    krProgress,
    keyResultsShown: krProgress.length,
    activitiesByStatus,
    topAssignees,
    projectIdsInScope: projectIds,
    emptyReason: null,
    progressEvolution,
    progressEvolutionGranularity,
    progressEvolutionHint,
  };
}
