import { redirect } from "next/navigation";
import { KeyResultForm } from "@/components/key-results/key-result-form";
import { PageHeading } from "@/components/layout/page-heading";
import { requireSessionUser } from "@/lib/auth/session-user";
import { formatResponsablesFromAreaMemberLinks } from "@/lib/areas/responsables-display";
import { canMutateKeyResults, strategicObjectiveOptionsWhere } from "@/lib/key-results/policy";
import { prisma } from "@/lib/prisma";

export default async function NuevoResultadoClavePage() {
  const session = await requireSessionUser();

  if (!canMutateKeyResults(session)) {
    redirect("/resultados-clave");
  }

  if (session.role !== "SUPER_ADMIN" && session.role !== "ADMIN_EMPRESA") {
    redirect("/resultados-clave");
  }

  if (session.role === "ADMIN_EMPRESA" && !session.companyId) {
    redirect("/dashboard");
  }

  const strategicRaw = await prisma.strategicObjective.findMany({
    where: {
      AND: [strategicObjectiveOptionsWhere(session), { areaId: { not: null } }],
    },
    include: {
      institutionalObjective: {
        select: {
          title: true,
          institutionalProject: { select: { title: true } },
          company: { select: { name: true } },
        },
      },
      area: {
        select: {
          id: true,
          name: true,
          memberLinks: {
            where: { esResponsable: true, user: { isActive: true } },
            select: { user: { select: { name: true } } },
          },
        },
      },
    },
    orderBy: [
      { institutionalObjective: { institutionalProject: { title: "asc" } } },
      { institutionalObjective: { sortOrder: "asc" } },
      { sortOrder: "asc" },
      { title: "asc" },
    ],
  });

  const strategicObjectives = strategicRaw.map((s) => ({
    id: s.id,
    title: s.title,
    projectTitle: s.institutionalObjective.institutionalProject.title,
    institutionalObjectiveTitle: s.institutionalObjective.title,
    companyName: s.institutionalObjective.company.name,
    companyId: s.companyId,
    areaId: s.areaId,
    areaName: s.area?.name ?? null,
    areaResponsablesLabel: formatResponsablesFromAreaMemberLinks(s.area?.memberLinks),
  }));

  return (
    <div className="px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
      <PageHeading
        title="Nuevo resultado clave"
        description="El área y los responsables se heredan del objetivo clave. Elegí cómo se calcula el avance."
      />
      {strategicObjectives.length === 0 ? (
        <p className="rounded-lg border border-dashed border-border/80 bg-muted/30 px-4 py-8 text-center text-sm text-muted-foreground">
          No hay objetivos clave con área asignada. En Objetivos clave, editá un objetivo y elegí un área antes de
          crear un resultado clave.
        </p>
      ) : (
        <KeyResultForm
          mode="create"
          viewerRole={session.role}
          strategicObjectives={strategicObjectives}
          defaultValues={{
            title: "",
            description: "",
            metricType: "NUMBER",
            weight: "1",
            sortOrder: "0",
            strategicObjectiveId: "",
            status: "DRAFT",
            unit: "",
            initialValue: "",
            targetValue: "",
            currentValue: "",
            targetDirection: "ASCENDENTE",
            calculationMode: "AUTOMATIC",
            progressMode: "WEIGHTED_AVERAGE",
            allowActivityImpact: true,
            manualProgress: "0",
            progressChangeNote: "",
          }}
          cancelHref="/resultados-clave"
        />
      )}
    </div>
  );
}
