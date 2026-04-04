import { redirect } from "next/navigation";
import { InstitutionalObjectiveForm } from "@/components/institutional-objectives/institutional-objective-form";
import { PageHeading } from "@/components/layout/page-heading";
import { requireSessionUser } from "@/lib/auth/session-user";
import {
  canMutateInstitutionalObjectives,
  institutionalProjectOptionsWhere,
} from "@/lib/institutional-objectives/policy";
import { prisma } from "@/lib/prisma";

export default async function NuevoObjetivoInstitucionalPage() {
  const session = await requireSessionUser();

  if (!canMutateInstitutionalObjectives(session)) {
    redirect("/objetivos");
  }

  if (session.role !== "SUPER_ADMIN" && session.role !== "ADMIN_EMPRESA") {
    redirect("/objetivos");
  }

  if (session.role === "ADMIN_EMPRESA" && !session.companyId) {
    redirect("/dashboard");
  }

  const projectsRaw = await prisma.institutionalProject.findMany({
    where: institutionalProjectOptionsWhere(session),
    include: { company: { select: { name: true } } },
    orderBy: { title: "asc" },
  });

  const projects = projectsRaw.map((p) => ({
    id: p.id,
    title: p.title,
    companyName: p.company.name,
  }));

  return (
    <div className="px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
      <PageHeading
        title="Nuevo objetivo institucional"
        description="La empresa se asigna automáticamente según el proyecto institucional seleccionado."
      />
      {projects.length === 0 ? (
        <p className="rounded-lg border border-dashed border-border/80 bg-muted/30 px-4 py-8 text-center text-sm text-muted-foreground">
          No hay proyectos institucionales disponibles para tu alcance. Creá uno en Proyecto institucional primero.
        </p>
      ) : (
        <InstitutionalObjectiveForm
          mode="create"
          viewerRole={session.role}
          projects={projects}
          defaultValues={{
            title: "",
            description: "",
            weight: "1",
            sortOrder: "0",
            institutionalProjectId: "",
            status: "DRAFT",
            includedInGeneralProgress: true,
          }}
          cancelHref="/objetivos"
        />
      )}
    </div>
  );
}
