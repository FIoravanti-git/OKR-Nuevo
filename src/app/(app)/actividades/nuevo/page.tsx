import { redirect } from "next/navigation";
import { ActivityForm } from "@/components/activities/activity-form";
import { PageHeading } from "@/components/layout/page-heading";
import { requireSessionUser } from "@/lib/auth/session-user";
import { canMutateActivities, keyResultOptionsWhere } from "@/lib/activities/policy";
import { prisma } from "@/lib/prisma";
import type { AssignableUserOption, KeyResultOptionForActivity } from "@/types/activity-admin";
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

  const [keyResultsRaw, usersRaw] = await Promise.all([
    prisma.keyResult.findMany({
      where: keyResultOptionsWhere(session),
      select: {
        id: true,
        title: true,
        companyId: true,
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
      orderBy: [{ sortOrder: "asc" }, { title: "asc" }],
    }),
    prisma.user.findMany({
      where: usersWhere,
      select: { id: true, name: true, email: true, companyId: true },
      orderBy: { name: "asc" },
    }),
  ]);

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
    };
  });

  const users: AssignableUserOption[] = usersRaw.map((u) => ({
    id: u.id,
    name: u.name,
    email: u.email,
    companyId: u.companyId,
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
            observation: "",
          }}
          cancelHref="/actividades"
        />
      )}
    </div>
  );
}
