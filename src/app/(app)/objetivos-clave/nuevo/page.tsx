import { redirect } from "next/navigation";
import { StrategicObjectiveForm } from "@/components/strategic-objectives/strategic-objective-form";
import { PageHeading } from "@/components/layout/page-heading";
import { requireSessionUser } from "@/lib/auth/session-user";
import {
  canMutateStrategicObjectives,
  institutionalObjectiveOptionsWhere,
} from "@/lib/strategic-objectives/policy";
import { prisma } from "@/lib/prisma";

export default async function NuevoObjetivoClavePage() {
  const session = await requireSessionUser();

  if (!canMutateStrategicObjectives(session)) {
    redirect("/objetivos-clave");
  }

  if (session.role !== "SUPER_ADMIN" && session.role !== "ADMIN_EMPRESA") {
    redirect("/objetivos-clave");
  }

  if (session.role === "ADMIN_EMPRESA" && !session.companyId) {
    redirect("/dashboard");
  }

  const objectivesRaw = await prisma.institutionalObjective.findMany({
    where: institutionalObjectiveOptionsWhere(session),
    include: {
      institutionalProject: { select: { title: true } },
      company: { select: { name: true } },
    },
    orderBy: [{ institutionalProject: { title: "asc" } }, { sortOrder: "asc" }, { title: "asc" }],
  });

  const institutionalObjectives = objectivesRaw.map((o) => ({
    id: o.id,
    title: o.title,
    projectTitle: o.institutionalProject.title,
    companyName: o.company.name,
  }));

  return (
    <div className="px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
      <PageHeading
        title="Nuevo objetivo clave"
        description="La empresa se asigna automáticamente según el objetivo institucional seleccionado."
      />
      {institutionalObjectives.length === 0 ? (
        <p className="rounded-lg border border-dashed border-border/80 bg-muted/30 px-4 py-8 text-center text-sm text-muted-foreground">
          No hay objetivos institucionales en tu alcance. Creá uno en Objetivos institucionales primero.
        </p>
      ) : (
        <StrategicObjectiveForm
          mode="create"
          viewerRole={session.role}
          institutionalObjectives={institutionalObjectives}
          defaultValues={{
            title: "",
            description: "",
            weight: "1",
            sortOrder: "0",
            institutionalObjectiveId: "",
            status: "DRAFT",
          }}
          cancelHref="/objetivos-clave"
        />
      )}
    </div>
  );
}
