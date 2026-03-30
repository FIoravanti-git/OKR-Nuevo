import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { InstitutionalProjectForm } from "@/components/institutional-projects/institutional-project-form";
import { PageHeading } from "@/components/layout/page-heading";
import { Button } from "@/components/ui/button";
import { requireSessionUser } from "@/lib/auth/session-user";
import { prisma } from "@/lib/prisma";
import {
  canMutateInstitutionalProject,
  canMutateInstitutionalProjects,
  canViewInstitutionalProject,
} from "@/lib/institutional-projects/policy";

type PageProps = { params: Promise<{ id: string }> };

export default async function EditProyectoInstitucionalPage({ params }: PageProps) {
  const { id } = await params;
  const session = await requireSessionUser();

  if (!canMutateInstitutionalProjects(session)) {
    redirect(`/proyecto/${id}`);
  }

  const project = await prisma.institutionalProject.findUnique({
    where: { id },
    include: { company: { select: { name: true } } },
  });

  if (!project) notFound();

  if (!canViewInstitutionalProject(session, project.companyId)) {
    redirect("/proyecto");
  }

  if (!canMutateInstitutionalProject(session, project.companyId)) {
    redirect("/proyecto");
  }

  if (session.role !== "SUPER_ADMIN" && session.role !== "ADMIN_EMPRESA") {
    redirect(`/proyecto/${id}`);
  }

  const companies =
    session.role === "SUPER_ADMIN"
      ? await prisma.company.findMany({
          select: { id: true, name: true },
          orderBy: { name: "asc" },
        })
      : [];

  return (
    <div className="px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
      <div className="mb-6">
        <Button variant="ghost" size="sm" className="mb-4 gap-1 px-0 text-muted-foreground" render={<Link href={`/proyecto/${id}`} />}>
          <ArrowLeft className="size-4" />
          Volver al detalle
        </Button>
        <PageHeading
          title={`Editar · ${project.title}`}
          description={`Organización: ${project.company.name}. El tenant no se puede cambiar.`}
        />
      </div>
      <InstitutionalProjectForm
        mode="edit"
        projectId={project.id}
        viewerRole={session.role}
        companies={companies}
        defaultValues={{
          title: project.title,
          description: project.description ?? "",
          mission: project.mission ?? "",
          vision: project.vision ?? "",
          year: project.year != null ? String(project.year) : "",
          methodology: project.methodology ?? "",
          status: project.status,
          companyId: project.companyId,
        }}
        cancelHref={`/proyecto/${id}`}
      />
    </div>
  );
}
