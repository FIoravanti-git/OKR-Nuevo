import "server-only";

import type { SessionUser } from "@/lib/auth/session-user";
import { prismaActivityOverdueWhere } from "@/lib/activities/overdue";
import { prisma } from "@/lib/prisma";
import type { ActivityStatus } from "@/generated/prisma";

export type SuperAdminDashboardStats = {
  kind: "SUPER_ADMIN";
  companies: number;
  users: number;
  institutionalProjects: number;
  institutionalObjectives: number;
  strategicObjectives: number;
  keyResults: number;
  activities: number;
  activitiesOverdue: number;
};

export type AdminEmpresaDashboardStats = {
  kind: "ADMIN_EMPRESA";
  companyId: string;
  institutionalProjects: number;
  institutionalObjectives: number;
  strategicObjectives: number;
  keyResults: number;
  activitiesPlanned: number;
  activitiesInProgress: number;
  activitiesOverdue: number;
};

export type OperadorDashboardStats = {
  kind: "OPERADOR";
  companyId: string;
  activitiesPlanned: number;
  activitiesInProgress: number;
  activitiesOverdue: number;
  activitiesWithYourProgress: number;
  recentProgress: Array<{
    id: string;
    createdAt: Date;
    activityTitle: string;
    newProgress: string | null;
    newStatus: ActivityStatus | null;
  }>;
};

export type DashboardStats =
  | SuperAdminDashboardStats
  | AdminEmpresaDashboardStats
  | OperadorDashboardStats;

export async function getDashboardStats(user: SessionUser): Promise<DashboardStats> {
  if (user.role === "SUPER_ADMIN") {
    const [
      companies,
      users,
      institutionalProjects,
      institutionalObjectives,
      strategicObjectives,
      keyResults,
      activities,
      activitiesOverdue,
    ] = await Promise.all([
      prisma.company.count(),
      prisma.user.count(),
      prisma.institutionalProject.count(),
      prisma.institutionalObjective.count(),
      prisma.strategicObjective.count(),
      prisma.keyResult.count(),
      prisma.activity.count(),
      prisma.activity.count({ where: prismaActivityOverdueWhere() }),
    ]);

    return {
      kind: "SUPER_ADMIN",
      companies,
      users,
      institutionalProjects,
      institutionalObjectives,
      strategicObjectives,
      keyResults,
      activities,
      activitiesOverdue,
    };
  }

  const companyId = user.companyId;
  if (!companyId) {
    if (user.role === "ADMIN_EMPRESA") {
      return {
        kind: "ADMIN_EMPRESA",
        companyId: "",
        institutionalProjects: 0,
        institutionalObjectives: 0,
        strategicObjectives: 0,
        keyResults: 0,
        activitiesPlanned: 0,
        activitiesInProgress: 0,
        activitiesOverdue: 0,
      };
    }
    return {
      kind: "OPERADOR",
      companyId: "",
      activitiesPlanned: 0,
      activitiesInProgress: 0,
      activitiesOverdue: 0,
      activitiesWithYourProgress: 0,
      recentProgress: [],
    };
  }

  if (user.role === "ADMIN_EMPRESA") {
    const [
      institutionalProjects,
      institutionalObjectives,
      strategicObjectives,
      keyResults,
      activitiesPlanned,
      activitiesInProgress,
      activitiesOverdue,
    ] = await Promise.all([
      prisma.institutionalProject.count({ where: { companyId } }),
      prisma.institutionalObjective.count({ where: { companyId } }),
      prisma.strategicObjective.count({ where: { companyId } }),
      prisma.keyResult.count({ where: { companyId } }),
      prisma.activity.count({ where: { companyId, status: "PLANNED" } }),
      prisma.activity.count({ where: { companyId, status: "IN_PROGRESS" } }),
      prisma.activity.count({ where: prismaActivityOverdueWhere(companyId) }),
    ]);

    return {
      kind: "ADMIN_EMPRESA",
      companyId,
      institutionalProjects,
      institutionalObjectives,
      strategicObjectives,
      keyResults,
      activitiesPlanned,
      activitiesInProgress,
      activitiesOverdue,
    };
  }

  const [activitiesPlanned, activitiesInProgress, activitiesOverdue, distinctParticipations, recentRaw] =
    await Promise.all([
    prisma.activity.count({ where: { companyId, status: "PLANNED" } }),
    prisma.activity.count({ where: { companyId, status: "IN_PROGRESS" } }),
    prisma.activity.count({ where: prismaActivityOverdueWhere(companyId) }),
    prisma.activityProgressLog.findMany({
      where: { companyId, changedByUserId: user.id },
      distinct: ["activityId"],
      select: { activityId: true },
    }),
    prisma.activityProgressLog.findMany({
      where: { companyId, changedByUserId: user.id },
      orderBy: { createdAt: "desc" },
      take: 8,
      include: {
        activity: { select: { title: true } },
      },
    }),
  ]);

  return {
    kind: "OPERADOR",
    companyId,
    activitiesPlanned,
    activitiesInProgress,
    activitiesOverdue,
    activitiesWithYourProgress: distinctParticipations.length,
    recentProgress: recentRaw.map((row) => ({
      id: row.id,
      createdAt: row.createdAt,
      activityTitle: row.activity.title,
      newProgress: row.newProgress != null ? row.newProgress.toString() : null,
      newStatus: row.newStatus,
    })),
  };
}
