import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { InstitutionalObjectiveForm } from "@/components/institutional-objectives/institutional-objective-form";
import { PageHeading } from "@/components/layout/page-heading";
import { Button } from "@/components/ui/button";
import { requireSessionUser } from "@/lib/auth/session-user";
import {
  canMutateInstitutionalObjective,
  canMutateInstitutionalObjectives,
  canViewInstitutionalObjective,
} from "@/lib/institutional-objectives/policy";
import { prisma } from "@/lib/prisma";

type PageProps = { params: Promise<{ id: string }> };

export default async function EditObjetivoInstitucionalPage({ params }: PageProps) {
  const { id } = await params;
  const session = await requireSessionUser();

  if (!canMutateInstitutionalObjectives(session)) {
    redirect(`/objetivos/${id}`);
  }

  const objective = await prisma.institutionalObjective.findUnique({
    where: { id },
    include: {
      institutionalProject: { select: { title: true, company: { select: { name: true } } } },
    },
  });

  if (!objective) notFound();

  if (!canViewInstitutionalObjective(session, objective.companyId)) {
    redirect("/objetivos");
  }

  if (!canMutateInstitutionalObjective(session, objective.companyId)) {
    redirect("/objetivos");
  }

  if (session.role !== "SUPER_ADMIN" && session.role !== "ADMIN_EMPRESA") {
    redirect(`/objetivos/${id}`);
  }

  const projects = [
    {
      id: objective.institutionalProjectId,
      title: objective.institutionalProject.title,
      companyName: objective.institutionalProject.company.name,
    },
  ];

  return (
    <div className="px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
      <div className="mb-6">
        <Button variant="ghost" size="sm" className="mb-4 gap-1 px-0 text-muted-foreground" render={<Link href={`/objetivos/${id}`} />}>
          <ArrowLeft className="size-4" />
          Volver al detalle
        </Button>
        <PageHeading
          title={`Editar · ${objective.title}`}
          description="El proyecto institucional asociado no se puede cambiar para preservar integridad del árbol OKR."
        />
      </div>
      <InstitutionalObjectiveForm
        mode="edit"
        objectiveId={objective.id}
        viewerRole={session.role}
        projects={projects}
        defaultValues={{
          title: objective.title,
          description: objective.description ?? "",
          weight: objective.weight.toString(),
          sortOrder: String(objective.sortOrder),
          institutionalProjectId: objective.institutionalProjectId,
          status: objective.status,
          includedInGeneralProgress: objective.includedInGeneralProgress,
        }}
        cancelHref={`/objetivos/${id}`}
      />
    </div>
  );
}
