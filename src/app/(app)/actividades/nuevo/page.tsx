import { redirect } from "next/navigation";
import { ActivityForm } from "@/components/activities/activity-form";
import { PageHeading } from "@/components/layout/page-heading";
import { requireSessionUser } from "@/lib/auth/session-user";
import { activityListWhere, canMutateActivities, keyResultOptionsWhere } from "@/lib/activities/policy";
import { prisma } from "@/lib/prisma";
import type {
  ActivityDependencyOption,
  AssignableUserOption,
  KeyResultOptionForActivity,
} from "@/types/activity-admin";
import type { Prisma } from "@/generated/prisma";

export default async function NuevaActividadPage() {
  const session = await requireSessionUser();

  if (!canMutateActivities(session)) {
    redirect("/actividades");
  }

  if (session.role !== "SUPER_ADMIN" && session.role !== "ADMIN_EMPRESA") {
    redirect("/actividades");
  }

  if (session.role === "ADMIN_EMPRESA" && !session.companyId) {
    redirect("/dashboard");
  }

  const usersWhere: Prisma.UserWhereInput = { isActive: true };
  if (session.role === "SUPER_ADMIN") {
    usersWhere.companyId = { not: null };
  } else if (session.companyId) {
    usersWhere.companyId = session.companyId;
  } else {
    usersWhere.id = "__none__";
  }

  const keyResultsRaw = await prisma.keyResult.findMany({
    where: keyResultOptionsWhere(session),
    select: {
      id: true,
      title: true,
      companyId: true,
      areaId: true,
      allowActivityImpact: true,
      progressMode: true,
      strategicObjective: {
        select: {
          title: true,
          areaId: true,
          institutionalObjective: {
            select: {
              title: true,
              institutionalProject: { select: { title: true } },
            },
          },
        },
      },
    },
    orderBy: [{ sortOrder: "asc" }, { title: "asc" }],
  });

  const krIds = keyResultsRaw.map((k) => k.id);
  const usersRaw = await prisma.user.findMany({
    where: usersWhere,
    select: {
      id: true,
      name: true,
      email: true,
      companyId: true,
      areaMemberships: { select: { areaId: true } },
    },
    orderBy: { name: "asc" },
  });
  const weightSums =
    krIds.length === 0
      ? []
      : await prisma.activity.groupBy({
          by: ["keyResultId"],
          where: { keyResultId: { in: krIds }, impactsProgress: true },
          _sum: { contributionWeight: true },
        });

  const sumByKrId = new Map(
    weightSums.map((s) => [s.keyResultId, Number(s._sum.contributionWeight ?? 0)])
  );

  const keyResults: KeyResultOptionForActivity[] = keyResultsRaw.map((k) => {
    const so = k.strategicObjective;
    const io = so.institutionalObjective;
    const p = io.institutionalProject;
    return {
      id: k.id,
      title: k.title,
      companyId: k.companyId,
      projectTitle: p.title,
      institutionalObjectiveTitle: io.title,
      strategicObjectiveTitle: so.title,
      keyResultAreaId: k.areaId,
      strategicObjectiveAreaId: so.areaId,
      allowActivityImpact: k.allowActivityImpact,
      progressMode: k.progressMode,
      otherImpactingWeightsSum: sumByKrId.get(k.id) ?? 0,
    };
  });

  const users: AssignableUserOption[] = usersRaw.map((u) => ({
    id: u.id,
    name: u.name,
    email: u.email,
    companyId: u.companyId,
    membershipAreaIds: u.areaMemberships.map((m) => m.areaId),
  }));

  const dependencyOptionsRaw = await prisma.activity.findMany({
    where: activityListWhere(session),
    select: {
      id: true,
      title: true,
      status: true,
      keyResult: { select: { title: true } },
    },
    orderBy: { title: "asc" },
    take: 500,
  });
  const dependencyOptions: ActivityDependencyOption[] = dependencyOptionsRaw.map((a) => ({
    id: a.id,
    title: a.title,
    status: a.status,
    keyResultTitle: a.keyResult.title,
  }));

  return (
    <div className="px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
      <PageHeading
        title="Nueva actividad"
        description="Asociá la tarea a un resultado clave; la empresa se hereda del KR. Elegí si impacta el cálculo del indicador."
      />
      {keyResults.length === 0 ? (
        <p className="rounded-lg border border-dashed border-border/80 bg-muted/30 px-4 py-8 text-center text-sm text-muted-foreground">
          No hay resultados clave en tu alcance. Creá uno en Resultados clave primero.
        </p>
      ) : (
        <ActivityForm
          mode="create"
          keyResults={keyResults}
          users={users}
          dependencyOptions={dependencyOptions}
          defaultValues={{
            title: "",
            description: "",
            keyResultId: "",
            assigneeUserId: "",
            startDate: "",
            dueDate: "",
            status: "PLANNED",
            impactsProgress: true,
            contributionWeight: "1",
            progressContributionStr: "",
            dependsOnActivityId: "",
            observation: "",
          }}
          cancelHref="/actividades"
        />
      )}
    </div>
  );
}
