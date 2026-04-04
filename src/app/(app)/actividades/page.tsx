import Link from "next/link";
import { Plus } from "lucide-react";
import { ActivitiesTable } from "@/components/activities/activities-table";
import { PageHeading } from "@/components/layout/page-heading";
import { SuperAdminTenantNotice } from "@/components/layout/super-admin-tenant-notice";
import { Button } from "@/components/ui/button";
import { requireSessionUser } from "@/lib/auth/session-user";
import { activityListWhere, canMutateActivities } from "@/lib/activities/policy";
import {
  isBlockedByPredecessor,
  isDelayedStartVsPlanned,
  plannedStartPassedWhileBlocked,
} from "@/lib/activities/dependency";
import { prisma } from "@/lib/prisma";
import type { ActivityAdminRow } from "@/types/activity-admin";
import type { Prisma } from "@/generated/prisma";

type PageProps = {
  searchParams?: Promise<{ resultadoClave?: string; vencidas?: string }>;
};

export default async function ActividadesPage({ searchParams }: PageProps) {
  const session = await requireSessionUser();
  const sp = (await searchParams) ?? {};
  const initialKr =
    typeof sp.resultadoClave === "string" && sp.resultadoClave ? sp.resultadoClave : undefined;
  const vencidasParam = typeof sp.vencidas === "string" ? sp.vencidas.toLowerCase() : "";
  const initialOverdueOnly = vencidasParam === "1" || vencidasParam === "true" || vencidasParam === "si";

  const where = activityListWhere(session);
  const canMutate = canMutateActivities(session);

  const usersWhere: Prisma.UserWhereInput = { isActive: true };
  if (session.role === "SUPER_ADMIN") {
    usersWhere.companyId = { not: null };
  } else if (session.companyId) {
    usersWhere.companyId = session.companyId;
  } else {
    usersWhere.id = "__none__";
  }

  const [activities, assigneeFilterOptions] = await Promise.all([
    prisma.activity.findMany({
      where,
      include: {
        assignee: { select: { id: true, name: true, email: true } },
        company: { select: { name: true } },
        dependsOnActivity: { select: { id: true, title: true, status: true } },
        keyResult: {
          select: {
            id: true,
            title: true,
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
        },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.user.findMany({
      where: usersWhere,
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
  ]);

  const rows: ActivityAdminRow[] = activities.map((a) => {
    const kr = a.keyResult;
    const so = kr.strategicObjective;
    const io = so.institutionalObjective;
    const p = io.institutionalProject;
    const pred = a.dependsOnActivity;
    const predStatus = pred?.status ?? null;
    const hasDep = Boolean(a.dependsOnActivityId);
    const dependencySatisfied = !hasDep || predStatus === "DONE";
    const blockedByDependency = isBlockedByPredecessor(a.dependsOnActivityId, predStatus);
    return {
      id: a.id,
      title: a.title,
      description: a.description,
      status: a.status,
      impactsProgress: a.impactsProgress,
      contributionWeight: a.contributionWeight.toString(),
      progressContribution: a.progressContribution != null ? Number(a.progressContribution) : null,
      startDate: a.startDate ? a.startDate.toISOString() : null,
      dueDate: a.dueDate ? a.dueDate.toISOString() : null,
      actualStartDate: a.actualStartDate ? a.actualStartDate.toISOString() : null,
      dependsOnActivityId: a.dependsOnActivityId,
      dependsOnTitle: pred?.title ?? null,
      dependsOnStatus: predStatus,
      dependencySatisfied,
      blockedByDependency,
      plannedStartAtRisk: plannedStartPassedWhileBlocked({
        startDate: a.startDate,
        dependsOnActivityId: a.dependsOnActivityId,
        predecessorStatus: predStatus,
      }),
      delayedStartVsPlanned: isDelayedStartVsPlanned({
        startDate: a.startDate,
        actualStartDate: a.actualStartDate,
      }),
      createdAt: a.createdAt.toISOString(),
      companyId: a.companyId,
      companyName: a.company.name,
      keyResultId: kr.id,
      keyResultTitle: kr.title,
      strategicObjectiveTitle: so.title,
      institutionalObjectiveTitle: io.title,
      projectTitle: p.title,
      assigneeUserId: a.assigneeUserId,
      assigneeName: a.assignee?.name ?? null,
      assigneeEmail: a.assignee?.email ?? null,
    };
  });

  const showSuperNotice = session.role === "SUPER_ADMIN" && !session.companyId;

  return (
    <div className="px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
      {showSuperNotice ? (
        <div className="mb-6">
          <SuperAdminTenantNotice />
        </div>
      ) : null}
      <PageHeading
        title="Actividades"
        description="Tareas bajo resultados clave: responsable, fechas, avance y opción de impactar el indicador."
      />
      {canMutate ? (
        <div className="mb-6 flex flex-wrap justify-end gap-2">
          <Button render={<Link href="/actividades/nuevo" />} className="gap-1.5">
            <Plus className="size-4" />
            Nueva actividad
          </Button>
        </div>
      ) : null}
      <ActivitiesTable
        data={rows}
        viewerRole={session.role}
        canMutate={canMutate}
        assigneeFilterOptions={assigneeFilterOptions}
        initialKeyResultId={initialKr}
        initialOverdueOnly={initialOverdueOnly}
      />
    </div>
  );
}
